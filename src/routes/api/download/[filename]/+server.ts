import { error } from '@sveltejs/kit';
import { createReadStream, existsSync } from 'fs';
import { stat } from 'fs/promises';
import { join } from 'path';
import type { RequestHandler } from './$types';

const STORAGE_PATH = process.env.STORAGE_PATH || './storage/processed';

export const GET: RequestHandler = async ({ params, cookies }) => {
	// Verify authentication
	const sessionId = cookies.get('session');
	if (!sessionId) {
		throw error(401, 'Unauthorized');
	}

	const { filename } = params;

	// Validate filename (prevent directory traversal)
	if (!filename || filename.includes('..') || filename.includes('/')) {
		throw error(400, 'Invalid filename');
	}

	const filePath = join(STORAGE_PATH, filename);

	// Check if file exists
	if (!existsSync(filePath)) {
		throw error(404, 'File not found');
	}

	try {
		const stats = await stat(filePath);
		const stream = createReadStream(filePath);

		// Determine content type based on extension
		const ext = filename.split('.').pop()?.toLowerCase();
		const contentTypes: Record<string, string> = {
			jpg: 'image/jpeg',
			jpeg: 'image/jpeg',
			png: 'image/png',
			webp: 'image/webp',
			gif: 'image/gif'
		};

		const contentType = contentTypes[ext || ''] || 'application/octet-stream';

		return new Response(stream as unknown as ReadableStream, {
			headers: {
				'Content-Type': contentType,
				'Content-Length': stats.size.toString(),
				'Content-Disposition': `attachment; filename="${filename}"`,
				'Cache-Control': 'private, max-age=3600'
			}
		});
	} catch (err) {
		console.error('Download error:', err);
		throw error(500, 'Failed to download file');
	}
};
