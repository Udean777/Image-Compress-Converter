import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { subscriptionService } from '$lib/server/services/SubscriptionService';
import { creditService } from '$lib/server/services/CreditService';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ success: false, error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const subscription = await subscriptionService.getActiveSubscription(locals.user.id);
		const credits = await creditService.getBalance(locals.user.id);
		const daysRemaining = await subscriptionService.getDaysRemaining(locals.user.id);

		return json({
			success: true,
			data: {
				subscription: subscription
					? {
							id: subscription.id,
							status: subscription.status,
							plan: {
								name: subscription.plan.name,
								displayName: subscription.plan.displayName,
								price: subscription.plan.price,
								credits: subscription.plan.credits
							},
							currentPeriodStart: subscription.currentPeriodStart,
							currentPeriodEnd: subscription.currentPeriodEnd
						}
					: null,
				credits,
				daysRemaining,
				tier: subscription?.plan.name ?? 'free'
			}
		});
	} catch (error) {
		console.error('Failed to fetch subscription:', error);
		return json({ success: false, error: 'Failed to fetch subscription' }, { status: 500 });
	}
};
