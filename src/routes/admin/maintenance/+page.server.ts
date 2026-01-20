import { redirect, fail } from '@sveltejs/kit';
import { AdminService } from '$lib/server/services/AdminService';

const adminService = new AdminService();

export const load = async ({ locals }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') throw redirect(303, '/dashboard');

	const isMaintenance = await adminService.getMaintenanceMode();

	return {
		isMaintenance
	};
};

export const actions = {
	toggle: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'ADMIN') return fail(401);

		const data = await request.formData();
		const active = data.get('active') === 'true';

		try {
			await adminService.setMaintenanceMode(active);
			return { success: true };
		} catch (error) {
			console.error('Maintenance Toggle Error:', error);
			return fail(500, { message: 'Failed to toggle maintenance mode' });
		}
	}
};
