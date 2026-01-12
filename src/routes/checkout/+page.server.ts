import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { pricingService } from '$lib/server/services/PricingService';
import { subscriptionService } from '$lib/server/services/SubscriptionService';

export const load: PageServerLoad = async ({ url, locals }) => {
	const user = locals.user;
	if (!user) throw redirect(302, '/login');

	const planId = url.searchParams.get('planId');
	if (!planId) throw error(400, 'Plan ID is required');

	const plan = await pricingService.getPlanById(planId);
	if (!plan) throw error(404, 'Plan not found');

	// Get current subscription to warn or redirect if already on plan (optional safety)
	const activeSubscription = await subscriptionService.getActiveSubscription(user.id);
	if (
		activeSubscription &&
		activeSubscription.planId === planId &&
		activeSubscription.status === 'active'
	) {
		throw redirect(302, '/dashboard?message=already_subscribed');
	}

	// Ensure features are parsed correctly
	let parsedFeatures: string[] = [];
	if (typeof plan.features === 'string') {
		try {
			parsedFeatures = JSON.parse(plan.features);
		} catch (e) {
			parsedFeatures = [];
		}
	} else if (Array.isArray(plan.features)) {
		parsedFeatures = plan.features as string[];
	}

	const paymentMethods = await subscriptionService.listPaymentMethods(user.id);

	return {
		plan: {
			...plan,
			features: parsedFeatures
		},
		paymentMethods,
		user: {
			name: user.name,
			email: user.email
		}
	};
};
