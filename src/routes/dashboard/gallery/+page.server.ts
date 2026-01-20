import { ImageService } from '$lib/server/services/ImageService';
import { UserService } from '$lib/server/services/UserService';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const imageService = new ImageService();
const userService = new UserService();

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(303, '/login');

	const historyRaw = await userService.getUserHistory(locals.user.id);

	const history = await Promise.all(
		historyRaw.map(async (item) => {
			const freshUrl = await imageService.generatePresignedUrl(item.fileName, false); // View inline, not download

			return {
				...item,
				outputUrl: freshUrl
			};
		})
	);

	return {
		history
	};
};
