import { redirect, fail } from '@sveltejs/kit';
import { AdminService } from '$lib/server/services/AdminService';

const adminService = new AdminService();

export const load = async ({ locals }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') throw redirect(303, '/dashboard');

	const plans = await adminService.getPricingPlans();

	return {
		plans
	};
};

export const actions = {
	update: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'ADMIN') return fail(401);

		const data = await request.formData();
		const id = data.get('id') as string;
		const displayName = data.get('displayName') as string;
		const price = parseInt(data.get('price') as string);
		const credits = parseInt(data.get('credits') as string);

		if (!id || !displayName || isNaN(price) || isNaN(credits)) {
			return fail(400, { message: 'All fields are required' });
		}

		try {
			await adminService.updatePricingPlan(id, { displayName, price, credits });
			return { success: true };
		} catch (error) {
			console.error('Update Plan Error:', error);
			return fail(500, { message: 'Failed to update plan' });
		}
	}
};
