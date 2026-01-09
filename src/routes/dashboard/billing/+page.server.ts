import { prisma } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';
import { subscriptionService } from '$lib/server/services/SubscriptionService';

export const load = async ({ locals }) => {
	const user = locals.user;
	if (!user) throw redirect(303, '/login');

	const [activeSubscription, payments] = await Promise.all([
		subscriptionService.getActiveSubscription(user.id),
		prisma.payment.findMany({
			where: { userId: user.id },
			orderBy: { createdAt: 'desc' }
		})
	]);

	return {
		activeSubscription,
		payments
	};
};

export const actions = {
	cancel: async ({ locals }) => {
		const user = locals.user;
		if (!user) throw redirect(303, '/login');

		const activeSub = await subscriptionService.getActiveSubscription(user.id);

		if (activeSub && activeSub.status === 'active') {
			await subscriptionService.cancelSubscription(activeSub.id, user.id);
			return { success: true };
		}

		return { success: false, message: 'No active subscription found' };
	}
};
