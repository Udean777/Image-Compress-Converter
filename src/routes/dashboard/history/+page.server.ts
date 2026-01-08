import { UserService } from '$lib/server/services/UserService';
import { ImageService } from '$lib/server/services/ImageService';
import { prisma } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const userService = new UserService();
const imageService = new ImageService();

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(303, '/');

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
	},
	delete: async ({ request, locals }) => {
		if (!locals.user) throw redirect(303, '/');
		const formData = await request.formData();
		const id = formData.get('id') as string;

		if (!id) return { success: false, message: 'ID is required' };

		try {
			await userService.deleteHistory(id, locals.user.id);
			return { success: true };
		} catch (error) {
			console.error('Delete error:', error);
			return { success: false, message: 'Failed to delete' };
		}
	},
	bulkDelete: async ({ request, locals }) => {
		if (!locals.user) throw redirect(303, '/');
		const formData = await request.formData();
		const idsString = formData.get('ids') as string;

		if (!idsString) return { success: false, message: 'IDs are required' };

		const ids = idsString.split(',');

		try {
			await prisma.history.deleteMany({
				where: {
					id: { in: ids },
					userId: locals.user.id
				}
			});
			return { success: true };
		} catch (error) {
			console.error('Bulk delete error:', error);
			return { success: false, message: 'Failed to delete items' };
		}
	}
};
