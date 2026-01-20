import { redirect, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { googleDriveService } from '$lib/server/services/GoogleDriveService';
import { CloudConnectorService } from '$lib/server/services/CloudConnectorService';

const connectorService = new CloudConnectorService();

export const GET: RequestHandler = async ({ url, locals }) => {
	const code = url.searchParams.get('code');
	const userId = locals.user?.id;

	if (!userId) {
		throw error(401, 'Unauthorized');
	}

	if (!code) {
		throw error(400, 'Code not provided');
	}

	try {
		const tokens = await googleDriveService.exchangeCode(code);

		// Store tokens in StorageConfig
		await connectorService.saveConfig(userId, 'google_drive', tokens);
	} catch (e) {
		console.error('Google OAuth Error:', e);
		throw error(500, 'Failed to connect Google Drive');
	}

	throw redirect(303, '/dashboard/connectors');
};
