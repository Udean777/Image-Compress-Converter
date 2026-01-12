import type { PrismaClient, Subscription, PricingPlan } from '@prisma/client';
import { prisma } from '../db';
import { creditService, CreditService } from './CreditService';
import { pricingService, PricingService } from './PricingService';

export interface SubscriptionWithPlan {
	id: string;
	userId: string;
	planId: string;
	status: string;
	currentPeriodStart: Date;
	currentPeriodEnd: Date;
	creditsRemaining: number;
	cancelledAt: Date | null;
	createdAt: Date;
	stripeSubscriptionId: string | null;
	plan: PricingPlan;
}

export interface CreateSubscriptionInput {
	userId: string;
	planId: string;
	paymentId?: string;
	stripeSubscriptionId?: string;
}

export class SubscriptionService {
	private db: PrismaClient;
	private creditSvc: CreditService;
	private pricingSvc: PricingService;

	constructor(
		database: PrismaClient = prisma,
		creditSvc: CreditService = creditService,
		pricingSvc: PricingService = pricingService
	) {
		this.db = database;
		this.creditSvc = creditSvc;
		this.pricingSvc = pricingSvc;
	}

	async getActiveSubscription(userId: string): Promise<SubscriptionWithPlan | null> {
		return this.db.subscription.findFirst({
			where: {
				userId,
				status: { in: ['active', 'cancelled'] },
				currentPeriodEnd: { gte: new Date() }
			},
			include: { plan: true },
			orderBy: { createdAt: 'desc' }
		});
	}

	async getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | null> {
		return this.db.subscription.findUnique({
			where: { stripeSubscriptionId }
		});
	}

	async activateSubscription(input: CreateSubscriptionInput): Promise<SubscriptionWithPlan> {
		const { userId, planId, paymentId } = input;

		const plan = await this.db.pricingPlan.findUniqueOrThrow({
			where: { id: planId }
		});
		const now = new Date();
		let periodEnd: Date;

		if (plan.interval === 'month') {
			periodEnd = new Date(now);
			periodEnd.setMonth(periodEnd.getMonth() + 1);
		} else if (plan.interval === 'year') {
			periodEnd = new Date(now);
			periodEnd.setFullYear(periodEnd.getFullYear() + 1);
		} else {
			periodEnd = new Date('2099-12-31');
		}

		const result = await this.db.$transaction(async (tx) => {
			// 1. Mark ANY existing active subs as cancelled (Gracefully handling plan changes)
			const cancelledResults = await tx.subscription.updateMany({
				where: {
					userId,
					status: 'active'
				},
				data: {
					status: 'cancelled',
					cancelledAt: now
				}
			});
			// 2. Expire credits from the "most recent" sub if it was a paid one
			const existingSub = await tx.subscription.findFirst({
				where: {
					userId,
					status: { in: ['active', 'cancelled'] },
					currentPeriodEnd: { gte: now }
				},
				include: { plan: true },
				orderBy: { createdAt: 'desc' }
			});

			if (existingSub && existingSub.plan.price > 0) {
				console.log(`[SubscriptionService] Expiring credits for old sub ${existingSub.id}`);
				await this.creditSvc.expireCredits(userId, existingSub.id);
			}

			// 3. Create the new subscription record
			const subscription = await tx.subscription.create({
				data: {
					userId,
					planId,
					status: 'active',
					currentPeriodStart: now,
					currentPeriodEnd: periodEnd,
					creditsRemaining: plan.credits,
					stripeSubscriptionId: input.stripeSubscriptionId
				},
				include: { plan: true }
			});

			// 4. Create the payment record for history tracking
			await tx.payment.create({
				data: {
					userId,
					subscriptionId: subscription.id,
					amount: plan.price,
					currency: plan.currency,
					status: 'paid',
					paymentType: 'stripe',
					midtransOrderId: paymentId || `SUB-${subscription.id}`,
					paidAt: now
				}
			});

			// 5. Add the actual credits to the user's account
			await this.creditSvc.addCredits(
				userId,
				plan.credits,
				'subscription_renew',
				`${plan.displayName} subscription activated`,
				paymentId
			);

			console.log(`[SubscriptionService] Added ${plan.credits} credits to user ${userId}`);

			return subscription;
		});

		return result;
	}

	async cancelSubscription(subscriptionId: string, userId: string): Promise<Subscription> {
		const subscription = await this.db.subscription.findFirst({
			where: {
				id: subscriptionId,
				userId,
				status: 'active'
			}
		});

		if (!subscription) {
			throw new Error('Active subscription not found');
		}

		// Jika ada ID Stripe, batalkan di Stripe juga
		if (subscription.stripeSubscriptionId) {
			const { Stripe } = await import('stripe'); // Import dinamis untuk menghindari issue SSR
			const { STRIPE_SECRET_KEY } = await import('$env/static/private');
			const stripe = new Stripe(STRIPE_SECRET_KEY);

			try {
				await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
				console.log(`✅ Subscription ${subscription.stripeSubscriptionId} cancelled in Stripe`);
			} catch (err) {
				console.error('Failed to cancel subscription in Stripe:', err);
				// Kita tetep lanjut update DB lokal meskipun Stripe gagal (atau handle sesuai kebijakan)
			}
		}

		return this.db.subscription.update({
			where: { id: subscriptionId },
			data: {
				status: 'cancelled',
				cancelledAt: new Date()
			}
		});
	}

	async processExpiredSubscriptions(): Promise<{ processed: number; errors: string[] }> {
		const now = new Date();
		const errors: string[] = [];

		const expiredSubscriptions = await this.db.subscription.findMany({
			where: {
				status: 'active',
				currentPeriodEnd: { lt: now }
			},
			include: { plan: true, user: true }
		});

		for (const sub of expiredSubscriptions) {
			try {
				await this.creditSvc.expireCredits(sub.userId, sub.id);
				await this.db.subscription.update({
					where: { id: sub.id },
					data: { status: 'expired' }
				});
			} catch (error) {
				errors.push(`Failed to process subscription ${sub.id}: ${error}`);
			}
		}

		return { processed: expiredSubscriptions.length, errors };
	}

	async getSubscriptionHistory(userId: string): Promise<SubscriptionWithPlan[]> {
		return this.db.subscription.findMany({
			where: { userId },
			include: { plan: true },
			orderBy: { createdAt: 'desc' }
		});
	}

	async getDaysRemaining(userId: string): Promise<number> {
		const subscription = await this.getActiveSubscription(userId);

		if (!subscription) {
			return 0;
		}

		const now = new Date();
		const end = new Date(subscription.currentPeriodEnd);
		const diffTime = end.getTime() - now.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

		return Math.max(0, diffDays);
	}

	/**
	 * Menangani perpanjangan otomatis dari Stripe (invoice.paid)
	 * Kita refresh kredit user dan perbarui masa aktif.
	 */
	async handleRenewal(
		stripeSubscriptionId: string,
		periodEnd: Date,
		referenceId: string
	): Promise<void> {
		const subscription = await this.db.subscription.findUnique({
			where: { stripeSubscriptionId },
			include: { plan: true }
		});

		if (!subscription) {
			console.error(`[Renewal] Subscription not found for Stripe ID: ${stripeSubscriptionId}`);
			return;
		}

		await this.db.$transaction(async (tx) => {
			// 1. Update masa aktif subscription
			await tx.subscription.update({
				where: { id: subscription.id },
				data: {
					currentPeriodEnd: periodEnd,
					status: 'active' // Pastikan status kembali active jika sebelumnya cancelled
				}
			});

			// 2. Tambah kredit baru sesuai paket
			await this.creditSvc.addCredits(
				subscription.userId,
				subscription.plan.credits,
				'subscription_renew',
				`Renewed ${subscription.plan.displayName} subscription`,
				referenceId
			);

			console.log(`✅ [Renewal] Processed for user ${subscription.userId}. Credits refreshed.`);
		});
	}

	/**
	 * Menangani penghentian layanan sepenuhnya (customer.subscription.deleted)
	 * Biasanya dipicu saat masa aktif sisa dari langganan yang sudah "cancelled" benar-benar habis.
	 */
	async handleExpiry(stripeSubscriptionId: string): Promise<void> {
		const subscription = await this.db.subscription.findUnique({
			where: { stripeSubscriptionId }
		});

		if (!subscription) return;

		await this.db.$transaction(async (tx) => {
			// 1. Ubah status jadi expired
			await tx.subscription.update({
				where: { id: subscription.id },
				data: { status: 'expired' }
			});

			// 2. Kredit sisa hangus (opsional, tergantung kebijakan)
			await this.creditSvc.expireCredits(subscription.userId, subscription.id);

			console.log(`🚨 [Expiry] Subscription ${subscription.id} is now expired.`);
		});
	}

	async getOrCreateCustomerId(userId: string): Promise<string> {
		const user = await this.db.user.findUniqueOrThrow({
			where: {
				id: userId
			}
		});

		const { Stripe } = await import('stripe');
		const { STRIPE_SECRET_KEY } = await import('$env/static/private');
		const stripe = new Stripe(STRIPE_SECRET_KEY);

		const customers = await stripe.customers.list({
			email: user.email,
			limit: 1
		});

		if (customers.data.length > 0) {
			return customers.data[0].id;
		}

		const customer = await stripe.customers.create({
			email: user.email,
			name: user.name ?? undefined,
			metadata: { userId: user.id }
		});

		return customer.id;
	}

	async createSetupIntent(userId: string) {
		const { Stripe } = await import('stripe');
		const { STRIPE_SECRET_KEY } = await import('$env/static/private');
		const stripe = new Stripe(STRIPE_SECRET_KEY);

		const customerId = await this.getOrCreateCustomerId(userId);

		return stripe.setupIntents.create({
			customer: customerId,
			payment_method_types: ['card']
		});
	}

	async listPaymentMethods(userId: string) {
		const { Stripe } = await import('stripe');
		const { STRIPE_SECRET_KEY } = await import('$env/static/private');
		const stripe = new Stripe(STRIPE_SECRET_KEY);

		const customerId = await this.getOrCreateCustomerId(userId);

		const paymentMethods = await stripe.paymentMethods.list({
			customer: customerId,
			type: 'card'
		});

		return paymentMethods.data;
	}

	async deletePaymentMethod(paymentMethodId: string) {
		const { Stripe } = await import('stripe');
		const { STRIPE_SECRET_KEY } = await import('$env/static/private');
		const stripe = new Stripe(STRIPE_SECRET_KEY);

		return stripe.paymentMethods.detach(paymentMethodId);
	}

	async deleteStripeCustomer(userId: string) {
		const { Stripe } = await import('stripe');
		const { STRIPE_SECRET_KEY } = await import('$env/static/private');
		const stripe = new Stripe(STRIPE_SECRET_KEY);

		// Get customer ID (reuse existing logic, but we might want to avoid creating if not exists,
		// but given the user is being deleted, creating just to fail finding it is okay/idempotent enough)
		// Better approach: Lookup user to get email, then list customers.
		const user = await this.db.user.findUnique({ where: { id: userId } });
		if (!user) return;

		const customers = await stripe.customers.list({
			email: user.email,
			limit: 1
		});

		if (customers.data.length > 0) {
			const customerId = customers.data[0].id;
			await stripe.customers.del(customerId);
			console.log(`✅ Deleted Stripe customer ${customerId} for user ${userId}`);
		}
	}
}

export const subscriptionService = new SubscriptionService();
