import { error } from '@sveltejs/kit';
import { ImageService } from '$lib/server/services/ImageService';
import archiver from 'archiver';
import { PassThrough } from 'stream';

// Helper to sanitize filenames for ZIP
function sanitizeFilename(url: string): string {
	try {
		const filename = url.split('/').pop()?.split('?')[0];
		return filename || `image-${Date.now()}.jpg`;
	} catch {
		return `image-${Date.now()}.jpg`;
	}
}

export const POST = async ({ request, locals }) => {
	if (!locals.user) throw error(401, 'Unauthorized');

	const { urls } = await request.json();
	if (!urls || !Array.isArray(urls) || urls.length === 0) {
		throw error(400, 'No files specified');
	}

	const stream = new PassThrough();
	const archive = archiver('zip', { zlib: { level: 9 } });

	archive.pipe(stream);

	// Process files
	const processPromises = urls.map(async (url: string) => {
		try {
			// Fetch the file content
			const response = await fetch(url);
			if (response.ok) {
				const arrayBuffer = await response.arrayBuffer();
				const buffer = Buffer.from(arrayBuffer);
				const name = sanitizeFilename(url);

				archive.append(buffer, { name });
			} else {
				console.error(`Failed to fetch file for zip: ${url} - Status: ${response.status}`);
			}
		} catch (e) {
			console.error(`Failed to zip file: ${url}`, e);
		}
	});

	// Wait for all fetches/appends to complete
	await Promise.all(processPromises);

	// Finalize the archive
	archive.finalize();

	return new Response(stream as any, {
		headers: {
			'Content-Type': 'application/zip',
			'Content-Disposition': 'attachment; filename="batch-download.zip"'
		}
	});
};
