import { json, error } from '@sveltejs/kit';
import { subscriptionService } from '$lib/server/services/SubscriptionService';

export const POST = async ({ locals }) => {
	if (!locals.user) throw error(401, 'Unauthorized');

	try {
		const setupIntent = await subscriptionService.createSetupIntent(locals.user.id);

		return json({ clientSecret: setupIntent.client_secret });
	} catch (err: any) {
		return json({ error: err.message }, { status: 500 });
	}
};
