import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { CloudConnectorService } from '$lib/server/services/CloudConnectorService';

const connectorService = new CloudConnectorService();

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw error(401, 'Unauthorized');

	const connectors = await connectorService.getActiveConfigs(locals.user.id);
	return { connectors };
};

export const actions: Actions = {
	save_s3: async ({ locals, request }) => {
		if (!locals.user) throw error(401, 'Unauthorized');

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

		const formData = await request.formData();
		const provider = formData.get('provider') as string;

		if (!provider) return fail(400, { message: 'Provider required' });

		await connectorService.deactivateConfig(locals.user.id, provider);
		return { success: true };
	}
};
