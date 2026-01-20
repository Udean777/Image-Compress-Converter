import { json, error } from '@sveltejs/kit';
import { subscriptionService } from '$lib/server/services/SubscriptionService';

export const GET = async ({ locals }) => {
	if (!locals.user) throw error(401, 'Unauthorized');

	try {
		const paymentMethods = await subscriptionService.listPaymentMethods(locals.user.id);

		return json(paymentMethods);
	} catch (err: any) {
		return json({ error: err.message }, { status: 500 });
	}
};

export const DELETE = async ({ locals, url }) => {
	if (!locals.user) throw error(401, 'Unauthorized');

	const id = url.searchParams.get('id');
	if (!id) throw error(400, 'ID required');

	await subscriptionService.deletePaymentMethod(id);
	return json({ success: true });
};
