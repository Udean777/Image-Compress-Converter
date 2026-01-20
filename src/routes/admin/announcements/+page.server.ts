import { redirect, fail } from '@sveltejs/kit';
import { AdminService } from '$lib/server/services/AdminService';
import type { Actions, PageServerLoad } from './$types';

const adminService = new AdminService();

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') throw redirect(303, '/dashboard');

	const announcements = await adminService.getAnnouncements();

	return {
		announcements
	};
};

export const actions: Actions = {
	upsert: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'ADMIN') return fail(401);

		const data = await request.formData();
		const id = data.get('id') as string;
		const title = data.get('title') as string;
		const content = data.get('content') as string;
		const type = data.get('type') as string;
		const target = data.get('target') as string;
		const isActive = data.get('isActive') === 'true';
		const expiresAtStr = data.get('expiresAt') as string;
		const expiresAt = expiresAtStr ? new Date(expiresAtStr) : null;

		if (!title || !content) {
			return fail(400, { message: 'Title and content are required' });
		}

		try {
			await adminService.upsertAnnouncement({
				id: id || undefined,
				title,
				content,
				type,
				target,
				isActive,
				expiresAt
			});
			return { success: true };
		} catch (error) {
			console.error('Upsert Announcement Error:', error);
			return fail(500, { message: 'Failed to save announcement' });
		}
	},

	delete: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'ADMIN') return fail(401);

		const data = await request.formData();
		const id = data.get('id') as string;

		if (!id) return fail(400, { message: 'ID is required' });

		try {
			await adminService.deleteAnnouncement(id);
			return { success: true };
		} catch (error) {
			console.error('Delete Announcement Error:', error);
			return fail(500, { message: 'Failed to delete announcement' });
		}
	}
};
