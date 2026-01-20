import { prisma } from '$lib/server/db';
import { subscriptionService } from '$lib/server/services/SubscriptionService';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(303, '/');

	const [user, subscription] = await Promise.all([
		prisma.user.findUnique({
			where: { id: locals.user.id },
			select: {
				email: true,
				credits: true,
				name: true,
				avatarUrl: true,
				role: true,
				createdAt: true
			}
		}),

		subscriptionService.getActiveSubscription(locals.user.id)
	]);

	if (!user) throw redirect(303, '/');
	return {
		user: {
			...user,
			planTier: subscription?.plan.name ?? 'free',
			planName: subscription?.plan.displayName ?? 'Free Plan'
		}
	};
};
