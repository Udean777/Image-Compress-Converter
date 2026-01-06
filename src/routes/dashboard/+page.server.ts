import { ImageService } from '$lib/server/services/ImageService';
import { UserService } from '$lib/server/services/UserService';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { prisma } from '$lib/server/db';
import { ProcessType, type ImageFormat } from '$lib/types/image.types';

const imageService = new ImageService();
const userService = new UserService();

export const load: PageServerLoad = async ({ cookies, locals }) => {
	const sessionId = cookies.get('session');
	if (!sessionId) throw redirect(303, '/login');

	const session = await prisma.session.findUnique({
		where: {
			id: sessionId
		},
		include: {
			user: true
		}
	});

	if (!session) throw redirect(303, '/login');

	const user = session.user;

	const historyRaw = await userService.getUserHistory(user.id);

	const history = await Promise.all(
		historyRaw.map(async (item) => {
			const freshUrl = await imageService.generatePresignedUrl(item.fileName, true);

			return {
				...item,
				outputUrl: freshUrl
			};
		})
	);

	return {
		user: { email: user.email, credits: user.credits },
		history
	};
};

export const actions: Actions = {
	process: async ({ cookies, request }) => {
		const sessionId = cookies.get('session');
		if (!sessionId) return fail(401, { message: 'Unauthorized' });
		const session = await prisma.session.findUnique({
			where: { id: sessionId },
			include: { user: true }
		});
		if (!session) return fail(401, { message: 'Unauthorized' });
		const user = session.user;

		const formData = await request.formData();
		const file = formData.get('image') as File;
		const type = formData.get('action') as ProcessType;
		const targetFormat = formData.get('format') as ImageFormat;

		if (!file || file.size === 0) {
			return fail(400, { message: 'Please upload a valid image' });
		}
		if (file.size > 5 * 1024 * 1024) {
			// Max 5MB
			return fail(400, { message: 'File size exceeds 5MB limit' });
		}

		try {
			const currentCredits = await userService.getUserCredits(user.id);
			if (currentCredits < 1) {
				return fail(400, { message: 'Insufficient credits' });
			}

			const result = await imageService.process({
				file,
				type: type || ProcessType.COMPRESS,
				targetFormat,
				userId: user.id
			});

			const newCreditBalance = await userService.recordActivity(
				user.id,
				type,
				targetFormat,
				result.fileName,
				result.publicUrl
			);

			return {
				success: true,
				newCredits: newCreditBalance,
				result: {
					url: result.publicUrl,
					downloadUrl: result.downloadUrl,
					originalSize: result.originalSize,
					newSize: result.newSize,
					format: result.format,
					stats: `Saved ${(100 - (result.newSize / result.originalSize) * 100).toFixed(1)}% size!`
				}
			};
		} catch (error: any) {
			console.error(error);
			return fail(500, { message: error.message || 'Processing failed' });
		}
	},

	delete: async ({ cookies, request }) => {
		const sessionId = cookies.get('session');
		if (!sessionId) return fail(401, { message: 'Unauthorized' });
		const session = await prisma.session.findUnique({
			where: { id: sessionId },
			include: { user: true }
		});
		if (!session) return fail(401, { message: 'Unauthorized' });

		const formData = await request.formData();
		const historyId = formData.get('historyId') as string;

		if (!historyId) {
			return fail(400, { message: 'Invalid history ID' });
		}

		await userService.deleteHistory(historyId, session.user.id);

		return { success: true };
	},

	logout: async ({ cookies }) => {
		const sessionId = cookies.get('session');
		if (sessionId) {
			await prisma.session
				.delete({
					where: { id: sessionId }
				})
				.catch(() => {});
		}
		cookies.delete('session', { path: '/' });
		throw redirect(303, '/login');
	}
};
