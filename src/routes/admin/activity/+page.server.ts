import { redirect } from '@sveltejs/kit';
import { AdminService } from '$lib/server/services/AdminService';

const adminService = new AdminService();

export const load = async ({ locals }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') throw redirect(303, '/dashboard');

	const activity = await adminService.getGlobalActivity(50);

	return {
		activity
	};
};
