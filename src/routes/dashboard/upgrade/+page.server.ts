import type { PageServerLoad } from './$types';
import { pricingService } from '$lib/server/services/PricingService';
import { subscriptionService } from '$lib/server/services/SubscriptionService';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	const plans = await pricingService.getPlans();

	const activeSubscription = await subscriptionService.getActiveSubscription(locals.user.id);

	return {
		plans: plans.map((plan) => ({
			id: plan.id,
			name: plan.name,
			displayName: plan.displayName,
			price: plan.price,
			currency: plan.currency,
			interval: plan.interval,
			credits: plan.credits,
			features: plan.parsedFeatures,
			isPopular: plan.name === 'pro',
			isActive: activeSubscription?.planId === plan.id
		})),
		activeSubscription
	};
};
