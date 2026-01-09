import { error, redirect } from '@sveltejs/kit';
import { Stripe } from 'stripe';
import { STRIPE_SECRET_KEY, APP_URL } from '$env/static/private';

const stripe = new Stripe(STRIPE_SECRET_KEY);

export const GET = async ({ locals }) => {
	const user = locals.user;
	if (!user) throw error(401, 'Unauthorized');

	const customers = await stripe.customers.list({ email: user.email, limit: 1 });
	if (customers.data.length === 0) throw error(404, 'Customer not found in Stripe');

	const portalSession = await stripe.billingPortal.sessions.create({
		customer: customers.data[0].id,
		return_url: `${APP_URL}/dashboard/billing`
	});

	throw redirect(303, portalSession.url);
};
