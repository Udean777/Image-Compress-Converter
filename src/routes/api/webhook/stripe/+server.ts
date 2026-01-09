import { json, error } from '@sveltejs/kit';
import { Stripe } from 'stripe';
import { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } from '$env/static/private';
import { subscriptionService } from '$lib/server/services/SubscriptionService';

const stripe = new Stripe(STRIPE_SECRET_KEY);

export const POST = async ({ request }) => {
	const signature = request.headers.get('stripe-signature');
	if (!signature) throw error(400, 'No signature');

	const body = await request.text();
	let event;

	try {
		event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
	} catch (err) {
		console.error('Webhook signature verification failed:', err);
		throw error(400, 'Invalid signature');
	}

	console.log(`[Webhook] Event Received: ${event.type} (${event.id})`);

	try {
		// 1. Sukses Pembayaran Pertama (Checkout)
		if (event.type === 'checkout.session.completed') {
			const session = event.data.object as Stripe.Checkout.Session;
			const userId = session.metadata?.userId;
			const planId = session.metadata?.planId;
			const stripeSubscriptionId = session.subscription as string;

			if (userId && planId) {
				await subscriptionService.activateSubscription({
					userId,
					planId,
					paymentId: session.id,
					stripeSubscriptionId
				});
				console.log(`✅ [Webhook] Initial subscription activated for user ${userId}`);
			}
		}

		// 2. Fallback: Subscription Dibuat Langsung
		if (event.type === 'customer.subscription.created') {
			const subscription = event.data.object as any;

			if (subscription.status === 'active') {
				const existingSub = await subscriptionService.getSubscriptionByStripeId(subscription.id);
				if (!existingSub) {
					let userId = subscription.metadata?.userId;
					const planId = subscription.metadata?.planId;

					if (!userId && subscription.customer) {
						const customer = (await stripe.customers.retrieve(
							subscription.customer as string
						)) as any;
						userId = customer.metadata?.userId;
					}

					if (userId && planId) {
						await subscriptionService.activateSubscription({
							userId,
							planId,
							paymentId: subscription.latest_invoice,
							stripeSubscriptionId: subscription.id
						});
						console.log(
							`✅ [Webhook] Direct API subscription activated via sub.created for user ${userId}`
						);
					}
				}
			}
		}

		// 3. Perpanjangan Sukses (Recurring Payment) Atau Aktivasi Pertama via Direct API
		if (event.type === 'invoice.paid') {
			const invoice = event.data.object as any;
			const stripeSubscriptionId =
				typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;

			if (stripeSubscriptionId) {
				// Cek apakah subscription sudah ada di DB lokal
				const existingSub =
					await subscriptionService.getSubscriptionByStripeId(stripeSubscriptionId);

				const subscription = (await stripe.subscriptions.retrieve(stripeSubscriptionId)) as any;
				const periodEnd = new Date(subscription.current_period_end * 1000);

				if (!existingSub) {
					// Jika belum ada, kemungkinan ini aktivasi pertama dari Quick Pay Direct API
					let userId = subscription.metadata?.userId;
					const planId = subscription.metadata?.planId;

					// Fallback ke customer metadata jika userId kosong
					if (!userId && subscription.customer) {
						const customer = (await stripe.customers.retrieve(
							subscription.customer as string
						)) as any;
						userId = customer.metadata?.userId;
					}

					if (userId && planId) {
						await subscriptionService.activateSubscription({
							userId,
							planId,
							paymentId: invoice.id,
							stripeSubscriptionId
						});
						console.log(`✅ [Webhook] Direct API subscription activated for user ${userId}`);
					} else {
						console.error(
							`[Webhook] Missing metadata for new subscription: ${stripeSubscriptionId}`
						);
					}
				} else {
					// Jika sudah ada, ini perpanjangan rutin
					await subscriptionService.handleRenewal(stripeSubscriptionId, periodEnd, invoice.id);
					console.log(`✅ [Webhook] Recurring payment succeeded for sub ${stripeSubscriptionId}`);
				}
			}
		}

		// 3. Status Subscription Berubah (Fallback Aktivasi)
		if (event.type === 'customer.subscription.updated') {
			const subscription = event.data.object as any;

			if (subscription.status === 'active') {
				const existingSub = await subscriptionService.getSubscriptionByStripeId(subscription.id);
				if (!existingSub) {
					let userId = subscription.metadata?.userId;
					const planId = subscription.metadata?.planId;

					if (!userId && subscription.customer) {
						const customer = (await stripe.customers.retrieve(
							subscription.customer as string
						)) as any;
						userId = customer.metadata?.userId;
					}

					if (userId && planId) {
						await subscriptionService.activateSubscription({
							userId,
							planId,
							paymentId: subscription.latest_invoice,
							stripeSubscriptionId: subscription.id
						});
						console.log(
							`✅ [Webhook] Direct API subscription activated via sub.updated for user ${userId}`
						);
					}
				}
			}
		}

		// 3. Pembatalan/Masa Aktif Habis (Fully Deleted)
		if (event.type === 'customer.subscription.deleted') {
			const subscription = event.data.object as any;
			await subscriptionService.handleExpiry(subscription.id);
			console.log(`🚨 [Webhook] Subscription ${subscription.id} now expired/deleted.`);
		}

		// 4. Gagal Bayar (Payment Failed)
		if (event.type === 'invoice.payment_failed') {
			const invoice = event.data.object as any;
			console.log(`❌ [Webhook] Renewal failed for user check: ${invoice.customer_email}`);
		}
	} catch (err: any) {
		console.error(`[Webhook Error] Processing ${event.type} failed:`, err);
	}

	return json({ received: true });
};
