import { prisma } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	const user = locals.user;
	if (!user) throw redirect(303, '/login');

	const [activeSubscription, payments] = await Promise.all([
		prisma.subscription.findFirst({
			where: { userId: user.id, status: 'active' },
			include: { plan: true }
		}),
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
