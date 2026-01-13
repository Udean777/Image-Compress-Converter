import { redirect, fail } from '@sveltejs/kit';
import { AdminService } from '$lib/server/services/AdminService';

const adminService = new AdminService();

export const load = async ({ locals }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') throw redirect(303, '/dashboard');

	const [stats, objects] = await Promise.all([
		adminService.getStorageStats(),
		adminService.listStorageObjects(100)
	]);

	return {
		stats,
		objects
	};
};

export const actions = {
	delete: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'ADMIN') return fail(401);

		const data = await request.formData();
		const key = data.get('key') as string;

		if (!key) return fail(400, { message: 'Key required' });

		try {
			await adminService.deleteStorageObject(key);
			return { success: true };
		} catch (error) {
			console.error('S3 Delete Error:', error);
			return fail(500, { message: 'Failed to delete file' });
		}
	},

	cleanup: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'ADMIN') return fail(401);

		const data = await request.formData();
		const days = parseInt(data.get('days') as string) || 7;

		try {
			const results = await adminService.cleanupOldFiles(days);
			return { success: true, count: results.length };
		} catch (error) {
			console.error('S3 Cleanup Error:', error);
			return fail(500, { message: 'Failed to run cleanup' });
		}
	}
};
