import { prisma } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';
import { AdminService } from '$lib/server/services/AdminService';

const adminService = new AdminService();

export const load = async ({ locals }) => {
	// Double check (redundant but safe)
	if (!locals.user || locals.user.role !== 'ADMIN') throw redirect(303, '/dashboard');

	const [totalUsers, totalRevenue, totalImages, revenueStats, userGrowth, topConsumers] =
		await Promise.all([
			prisma.user.count(),
			prisma.payment.aggregate({
				_sum: { amount: true },
				where: { status: 'paid' }
			}),
			prisma.history.count(),
			adminService.getRevenueStats(30),
			adminService.getUserGrowthStats(30),
			adminService.getTopUsersAnalytics(5)
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
		revenueStats,
		userGrowth,
		recentUsers,
		topConsumers
	};
};

export const actions = {
	bulk_credits: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'ADMIN') throw redirect(303, '/dashboard');

		const data = await request.formData();
		const userIds = JSON.parse((data.get('userIds') as string) || '[]');
		const amount = parseInt(data.get('amount') as string);
		const description = data.get('description') as string;

		if (!userIds.length || isNaN(amount)) {
			return { success: false, message: 'Invalid data' };
		}

		try {
			await adminService.bulkGrantCredits(userIds, amount, description);
			return { success: true };
		} catch (error) {
			console.error('Bulk Credits Error:', error);
			return { success: false, message: 'Failed to grant credits' };
		}
	}
};
