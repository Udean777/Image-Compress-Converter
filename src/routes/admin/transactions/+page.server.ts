import { redirect, fail } from '@sveltejs/kit';
import { AdminService } from '$lib/server/services/AdminService';
import type { Actions, PageServerLoad } from './$types';

const adminService = new AdminService();

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') throw redirect(303, '/dashboard');

	const userId = url.searchParams.get('userId') || undefined;
	const type = url.searchParams.get('type') || undefined;
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = 50;
	const offset = (page - 1) * limit;

	const { items: transactions, total } = await adminService.getCreditTransactions({
		userId,
		type,
		limit,
		offset
	});

	return {
		transactions,
		total,
		page,
		limit,
		totalPages: Math.ceil(total / limit)
	};
};

export const actions: Actions = {
	export: async ({ locals, url }) => {
		if (!locals.user || locals.user.role !== 'ADMIN') return fail(401);

		const userId = url.searchParams.get('userId') || undefined;
		const type = url.searchParams.get('type') || undefined;

		// Get more for export, or all if feasible
		const { items } = await adminService.getCreditTransactions({
			userId,
			type,
			limit: 1000 // Limit for export to prevent memory issues, could be higher
		});

		const csv = await adminService.generateTransactionCSV(items);

		return {
			exportData: csv,
			fileName: `transactions-${new Date().toISOString().split('T')[0]}.csv`
		};
	}
};
