import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { CloudConnectorService } from '$lib/server/services/CloudConnectorService';

const connectorService = new CloudConnectorService();

function isProUser(locals: App.Locals) {
	return locals.user?.planTier && locals.user.planTier !== 'free'; // Assuming 'free' is the default
}

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw error(401, 'Unauthorized');

	const connectors = await connectorService.getActiveConfigs(locals.user.id);
    const isPro = isProUser(locals); // hooks.server.ts populates planTier

	return { connectors, isPro };
};

export const actions: Actions = {
	save_s3: async ({ locals, request }) => {
		if (!locals.user) throw error(401, 'Unauthorized');
        if (!isProUser(locals)) return fail(403, { message: 'This feature requires a Pro subscription' });

		const formData = await request.formData();
		const endpoint = formData.get('endpoint') as string;
		const region = formData.get('region') as string;
		const accessKey = formData.get('accessKey') as string;
		const secretKey = formData.get('secretKey') as string;
		const bucket = formData.get('bucket') as string;

		if (!endpoint || !accessKey || !secretKey || !bucket) {
			return fail(400, { message: 'All fields are required' });
		}

		await connectorService.saveConfig(locals.user.id, 's3', {
			endpoint,
			region: region || 'us-east-1',
			accessKey,
			secretKey,
			bucket
		});

		return { success: true };
	},

	delete: async ({ locals, request }) => {
		if (!locals.user) throw error(401, 'Unauthorized');
        // We probably shouldn't block deletion if they downgrade, but let's be strict for now or allow cleanup?
        // User asked for "strict features for pro". But deleting usually should be allowed to cleanup data.
        // Let's allow delete for now to avoid locking them in with data they can't remove?
        // OR better, strict lock means they can't USE it.
        // Let's block modification. If they are free, they shouldn't be here.
        if (!isProUser(locals)) return fail(403, { message: 'This feature requires a Pro subscription' });

		const formData = await request.formData();
		const provider = formData.get('provider') as string;

		if (!provider) return fail(400, { message: 'Provider required' });

		await connectorService.deactivateConfig(locals.user.id, provider);
		return { success: true };
	}
};
