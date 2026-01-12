import { prisma } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	// Double check (redundant but safe)
	if (!locals.user || locals.user.role !== 'ADMIN') throw redirect(303, '/dashboard');

	const [totalUsers, totalRevenue, totalImages] = await Promise.all([
		prisma.user.count(),
		prisma.payment.aggregate({
			_sum: { amount: true },
			where: { status: 'paid' }
		}),
		prisma.history.count()
	]);

	const recentUsers = await prisma.user.findMany({
		take: 5,
		orderBy: { createdAt: 'desc' }
	});

	return {
		stats: {
			users: totalUsers,
			revenue: totalRevenue._sum.amount || 0,
			images: totalImages
		},
		recentUsers
	};
};
