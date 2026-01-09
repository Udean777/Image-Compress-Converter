import { json, error, redirect } from '@sveltejs/kit';
import { Stripe } from 'stripe';
import { STRIPE_SECRET_KEY, APP_URL } from '$env/static/private';
import { pricingService } from '$lib/server/services/PricingService';

const stripe = new Stripe(STRIPE_SECRET_KEY);

export const GET = async ({ url, locals }) => {
	const user = locals.user;
	if (!user) throw error(401, 'Unauthorized');

	const planId = url.searchParams.get('plan');
	if (!planId) throw error(400, 'Plan ID is required');

	const plan = await pricingService.getPlanById(planId);
	if (!plan) throw error(404, 'Plan not found');

	let session;
	try {
		let stripeCustomerId;

		const customers = await stripe.customers.list({
			email: user.email,
			limit: 1
		});

		if (customers.data.length > 0) {
			stripeCustomerId = customers.data[0].id;
		} else {
			const customer = await stripe.customers.create({
				email: user.email,
				name: user.name ?? undefined,
				metadata: { userId: user.id }
			});
			stripeCustomerId = customer.id;
		}

		session = await stripe.checkout.sessions.create({
			customer: stripeCustomerId,
			payment_method_types: ['card'],
			line_items: [
				{
					price_data: {
						currency: plan.currency.toLowerCase(),
						product_data: {
							name: plan.displayName,
							description: `${plan.credits} Credits for Image Studio`
						},
						unit_amount: plan.price * 100,
						recurring: plan.interval !== 'once' ? { interval: 'month' } : undefined
					},
					quantity: 1
				}
			],
			mode: plan.interval !== 'once' ? 'subscription' : 'payment',
			success_url: `${APP_URL}/dashboard/upgrade?success=true`,
			cancel_url: `${APP_URL}/dashboard/upgrade`,
			metadata: {
				userId: user.id,
				planId: plan.id
			}
		});
	} catch (err) {
		console.error('Stripe checkout error:', err);
		throw error(500, 'Payment initialization failed');
	}

	if (!session.url) throw error(500, 'Failed to create stripe session');

	throw redirect(303, session.url);
};
