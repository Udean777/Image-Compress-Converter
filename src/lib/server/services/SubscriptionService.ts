import type { PrismaClient, Subscription, PricingPlan } from '@prisma/client';
import { prisma } from '../db';
import { creditService, CreditService } from './CreditService';
import { pricingService, PricingService } from './PricingService';

export interface SubscriptionWithPlan extends Subscription {
	plan: PricingPlan;
}

export interface CreateSubscriptionInput {
	userId: string;
	planId: string;
	paymentId?: string;
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
				status: 'active',
				currentPeriodEnd: { gte: new Date() }
			},
			include: { plan: true },
			orderBy: { createdAt: 'desc' }
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
			await tx.subscription.updateMany({
				where: {
					userId,
					status: 'active'
				},
				data: {
					status: 'cancelled',
					cancelledAt: now
				}
			});

			const existingSub = await this.getActiveSubscription(userId);
			if (existingSub && existingSub.plan.price > 0) {
				await this.creditSvc.expireCredits(userId, existingSub.id);
			}

			const subscription = await tx.subscription.create({
				data: {
					userId,
					planId,
					status: 'active',
					currentPeriodStart: now,
					currentPeriodEnd: periodEnd,
					creditsRemaining: plan.credits
				},
				include: { plan: true }
			});

			// Tambahkan rekaman pembayaran di sini agar muncul di History
			await tx.payment.create({
				data: {
					userId,
					subscriptionId: subscription.id,
					amount: plan.price,
					currency: plan.currency,
					status: 'paid',
					paymentType: 'stripe',
					midtransOrderId: paymentId || `SUB-${subscription.id}`, // Gunakan paymentId dari Stripe
					paidAt: now
				}
			});

			await this.creditSvc.addCredits(
				userId,
				plan.credits,
				'subscription_renew',
				`${plan.displayName} subscription activated`,
				paymentId
			);
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
}

export const subscriptionService = new SubscriptionService();
