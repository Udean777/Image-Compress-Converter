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

	if (event.type === 'checkout.session.completed') {
		const session = event.data.object as Stripe.Checkout.Session;
		const userId = session.metadata?.userId;
		const planId = session.metadata?.planId;

		if (userId && planId) {
			await subscriptionService.activateSubscription({
				userId,
				planId,
				paymentId: session.id
			});
			console.log(`✅ Stripe Subscription activated for user ${userId}`);
		}
	}

	return json({ received: true });
};
