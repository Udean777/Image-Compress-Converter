import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { googleDriveService } from '$lib/server/services/GoogleDriveService';

export const GET: RequestHandler = async () => {
	const url = googleDriveService.getAuthUrl();
	throw redirect(303, url);
};
