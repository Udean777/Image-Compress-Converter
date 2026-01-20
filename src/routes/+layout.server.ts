import type { LayoutServerLoad } from './$types';

import { prisma } from '$lib/server/db';

export const load: LayoutServerLoad = async ({ locals }) => {
	let announcements: any[] = [];

	if (locals.user) {
		const userTier = locals.user.planTier || 'free';
		const targets = ['all', userTier];
		if (userTier === 'pro' || userTier === 'business') {
			targets.push('pro'); // Catch-all for pro/business targets if needed
		}

		announcements = await prisma.announcement.findMany({
			where: {
				isActive: true,
				target: { in: targets },
				OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }]
			},
			orderBy: { createdAt: 'desc' }
		});
	}

	return {
		user: locals.user,
		announcements
	};
};
