import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { pricingService } from '$lib/server/services/PricingService';

export const GET: RequestHandler = async () => {
	try {
		const plans = await pricingService.getPlans();

		return json({
			success: true,
			data: plans.map((plan) => ({
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
		});
	} catch (error) {
		console.error('Failed to fetch pricing plans:', error);
		return json({ success: false, error: 'Failed to fetch pricing plans' }, { status: 500 });
	}
};
