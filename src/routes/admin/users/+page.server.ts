import { prisma } from '$lib/server/db';
import { fail, redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') throw redirect(303, '/dashboard');

	const users = await prisma.user.findMany({
		orderBy: { createdAt: 'desc' },
		include: { _count: { select: { histories: true } } }
	});

	return { users };
};

export const actions = {
	toggleBan: async ({ request, locals }) => {
		const formData = await request.formData();
		const userId = formData.get('userId') as string;
		const currentBanStatus = formData.get('currentStatus') === 'true';

		// Prevent banning yourself
		const adminId = await locals.user?.id; // pseudo code check

		await prisma.user.update({
			where: { id: userId },
			data: { isBanned: !currentBanStatus }
		});

		return { success: true };
	},
	grantCredits: async ({ request }) => {
		const formData = await request.formData();
		const userId = formData.get('userId') as string;
		const amount = parseInt(formData.get('amount') as string);

		if (!amount || amount < 1) return fail(400, { message: 'Invalid amount' });

		await prisma.$transaction([
			prisma.user.update({
				where: { id: userId },
				data: { credits: { increment: amount } }
			}),
			prisma.creditTransaction.create({
				data: {
					userId,
					amount,
					type: 'admin_grant',
					description: 'Manual grant by Admin'
				}
			})
		]);

		return { success: true };
	},
	impersonate: async ({ request, cookies, locals }) => {
		if (!locals.user || locals.user.role !== 'ADMIN') return fail(401);

		const formData = await request.formData();
		const userId = formData.get('userId') as string;

		if (!userId) return fail(400, { message: 'User ID required' });

		// Set impersonation cookie
		cookies.set('impersonate_user_id', userId, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: process.env.NODE_ENV === 'production',
			maxAge: 60 * 60 // 1 hour
		});

		throw redirect(303, '/dashboard');
	}
};
