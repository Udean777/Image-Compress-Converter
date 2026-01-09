import { json, error } from '@sveltejs/kit';
import { Stripe } from 'stripe';
import { STRIPE_SECRET_KEY } from '$env/static/private';
import { pricingService } from '$lib/server/services/PricingService';
import { subscriptionService } from '$lib/server/services/SubscriptionService';

const stripe = new Stripe(STRIPE_SECRET_KEY);

export const POST = async ({ request, locals }) => {
	const user = locals.user;
	if (!user) throw error(401, 'Unauthorized');

	const { planId, paymentMethodId } = await request.json();
	if (!planId || !paymentMethodId) throw error(400, 'Plan ID and Payment Method ID are required');

	const plan = await pricingService.getPlanById(planId);
	if (!plan) throw error(404, 'Plan not found');

	try {
		const customerId = await subscriptionService.getOrCreateCustomerId(user.id);

		await stripe.paymentMethods.attach(paymentMethodId, {
			customer: customerId
		});

		await stripe.customers.update(customerId, {
			invoice_settings: {
				default_payment_method: paymentMethodId
			}
		});

		const products = await stripe.products.list({ limit: 100 });
		let product = products.data.find((p) => p.name === plan.displayName);

		if (!product) {
			product = await stripe.products.create({
				name: plan.displayName,
				description: `${plan.credits} Credits for Image Studio`,
				metadata: { planId: plan.id }
			});
		}

		const prices = await stripe.prices.list({ product: product.id, limit: 1 });
		let price = prices.data[0];

		if (!price) {
			price = await stripe.prices.create({
				product: product.id,
				unit_amount: plan.price * 100,
				currency: plan.currency.toLowerCase(),
				recurring: plan.interval !== 'once' ? { interval: 'month' } : undefined
			});
		}

		let subscription = await stripe.subscriptions.create({
			customer: customerId,
			items: [{ price: price.id }],
			default_payment_method: paymentMethodId,
			payment_behavior: 'allow_incomplete',
			payment_settings: { save_default_payment_method: 'on_subscription' },
			expand: ['latest_invoice.payment_intent'],
			metadata: {
				userId: user.id,
				planId: plan.id
			}
		});

		let status = subscription.status;
		let paymentIntent: any = null;

		if (status === 'incomplete' || status === 'past_due') {
			for (let i = 0; i < 6; i++) {
				const sub = await stripe.subscriptions.retrieve(subscription.id, {
					expand: ['latest_invoice.payment_intent']
				});
				status = sub.status;

				if (status === 'active') {
					break;
				}

				const subInvoices = (await stripe.invoices.list({
					subscription: subscription.id,
					limit: 1,
					expand: ['data.payment_intent']
				})) as any;

				const latestInv = subInvoices.data[0];
				if (latestInv?.payment_intent) {
					paymentIntent = latestInv.payment_intent;
					break;
				}

				const recentPIs = await stripe.paymentIntents.list({
					customer: customerId,
					limit: 5
				});
				const matchingPI = recentPIs.data.find(
					(pi: any) =>
						pi.metadata?.subscription_id === subscription.id ||
						pi.invoice === latestInv?.id ||
						pi.description?.includes(subscription.id) ||
						pi.status === 'requires_action' ||
						pi.status === 'requires_payment_method'
				);

				if (matchingPI) {
					paymentIntent = matchingPI;
					break;
				}

				await new Promise((r) => setTimeout(r, 750));
			}
		}

		let clientSecret = null;
		if (paymentIntent) {
			if (typeof paymentIntent === 'string') {
				const fullPI = await stripe.paymentIntents.retrieve(paymentIntent);
				clientSecret = fullPI.client_secret;
			} else {
				clientSecret = paymentIntent.client_secret;
			}
		}

		return json({
			subscriptionId: subscription.id,
			status,
			clientSecret
		});
	} catch (err: any) {
		if (err instanceof Stripe.errors.StripeCardError) {
			return json({ error: err.message }, { status: 400 });
		}
		console.error('Subscription error:', err);
		return json({ error: err.message || 'Internal server error' }, { status: 500 });
	}
};
