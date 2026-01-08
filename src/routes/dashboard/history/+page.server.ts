import { UserService } from '$lib/server/services/UserService';
import { ImageService } from '$lib/server/services/ImageService';
import { prisma } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const userService = new UserService();
const imageService = new ImageService();

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(303, '/login');

	const historyRaw = await userService.getUserHistory(locals.user.id);

	const history = await Promise.all(
		historyRaw.map(async (item) => {
			const freshUrl = await imageService.generatePresignedUrl(item.fileName, true);

			return {
				...item,
				outputUrl: freshUrl,
				createdAt: item.createdAt.toISOString()
			};
		})
	);

	return { history };
};

export const actions: Actions = {
	logout: async ({ cookies }) => {
		const { performLogout } = await import('$lib/server/auth');
		await performLogout(cookies);
	}
};
