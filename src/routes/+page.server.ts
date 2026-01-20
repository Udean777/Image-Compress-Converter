import type { PageServerLoad } from './$types';
import { pricingService } from '$lib/server/services/PricingService';

export const load: PageServerLoad = async () => {
	const plans = await pricingService.getPlans();

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
			isPopular: plan.name === 'pro'
		}))
	};
};
