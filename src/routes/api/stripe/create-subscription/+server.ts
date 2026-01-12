import { json, error } from '@sveltejs/kit';
import { Stripe } from 'stripe';
import { STRIPE_SECRET_KEY } from '$env/static/private';
import { pricingService } from '$lib/server/services/PricingService';
import { subscriptionService } from '$lib/server/services/SubscriptionService';

const stripe = new Stripe(STRIPE_SECRET_KEY);

export const POST = async ({ request, locals }) => {
	const user = locals.user;
	if (!user) throw error(401, 'Unauthorized');

	try {
		const { planId, paymentMethodId } = await request.json();
		if (!planId) throw error(400, 'Plan ID is required');

		const plan = await pricingService.getPlanById(planId);
		if (!plan) throw error(404, 'Plan not found');

		// 1. Get or Create Customer
		const customerId = await subscriptionService.getOrCreateCustomerId(user.id);

		// 2. Attach Payment Method if provided
		if (paymentMethodId) {
			try {
				await stripe.paymentMethods.attach(paymentMethodId, {
					customer: customerId
				});

				// Set as default for invoice settings
				await stripe.customers.update(customerId, {
					invoice_settings: {
						default_payment_method: paymentMethodId
					}
				});
			} catch (err) {
				console.error('Failed to attach payment method:', err);
				throw error(400, 'Invalid Payment Method');
			}
		}

		// 3. Find or Create Price (Stripe Subscriptions require an existing Price ID)
		let priceId: string;

		// Check for existing product with this plan name
		const products = await stripe.products.list({
			limit: 100,
			active: true,
			created: { gt: 0 }
		});

		let product = products.data.find((p) => p.name === plan.displayName);

		if (!product) {
			product = await stripe.products.create({
				name: plan.displayName,
				metadata: { planId: plan.id }
			});
		}

		// Check for existing price
		const prices = await stripe.prices.list({
			product: product.id,
			active: true,
			limit: 20
		});

		const existingPrice = prices.data.find(
			(p) =>
				p.unit_amount === plan.price * 100 &&
				p.currency === plan.currency.toLowerCase() &&
				p.recurring?.interval === (plan.interval === 'year' ? 'year' : 'month')
		);

		if (existingPrice) {
			priceId = existingPrice.id;
		} else {
			const newPrice = await stripe.prices.create({
				product: product.id,
				unit_amount: plan.price * 100,
				currency: plan.currency.toLowerCase(),
				recurring: { interval: plan.interval === 'year' ? 'year' : 'month' },
				metadata: { planId: plan.id }
			});
			priceId = newPrice.id;
		}

		// 4. Create Subscription
		const subscription = await stripe.subscriptions.create({
			customer: customerId,
			items: [{ price: priceId }],
			default_payment_method: paymentMethodId,
			payment_behavior: 'allow_incomplete',
			expand: ['latest_invoice.payment_intent'],
			metadata: {
				userId: user.id,
				planId: plan.id
			}
		});

		// 5. Handle Status
		const status = subscription.status;
		let clientSecret = null;

		if (status === 'incomplete' || status === 'past_due') {
			const latestInvoice = subscription.latest_invoice as Stripe.Invoice & {
				payment_intent: Stripe.PaymentIntent;
			};

			const paymentIntent = latestInvoice?.payment_intent;
			if (paymentIntent?.client_secret) {
				clientSecret = paymentIntent.client_secret;
			}
		}

		return json({
			subscriptionId: subscription.id,
			status,
			clientSecret
		});
	} catch (err: any) {
		console.error('Create subscription error:', err);
		return json({ error: err.message }, { status: 500 });
	}
};
