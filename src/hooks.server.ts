import type { Handle } from '@sveltejs/kit';
import { prisma } from '$lib/server/db';
import { ensurePublicBucket } from '$lib/server/s3';
import { verifyToken, createAccessToken } from '$lib/server/jwt';

// Ensure S3 bucket is configured correctly
ensurePublicBucket().catch(console.error);

export const handle: Handle = async ({ event, resolve }) => {
	const accessToken = event.cookies.get('access_token');
	const refreshToken = event.cookies.get('refresh_token');

	let userPayload = accessToken ? await verifyToken(accessToken) : null;

	// If no valid access token but we have a refresh token
	if (!userPayload && refreshToken) {
		const session = await prisma.session.findUnique({
			where: { id: refreshToken },
			include: { user: true }
		});

		if (session && Date.now() < session.expiresAt.getTime()) {
			// Issue new access token
			const user = session.user;
			userPayload = { id: user.id, email: user.email, name: user.name };

			const newAccessToken = await createAccessToken(user);
			event.cookies.set('access_token', newAccessToken, {
				path: '/',
				httpOnly: true,
				sameSite: 'strict',
				secure: process.env.NODE_ENV === 'production',
				maxAge: 60 * 15 // 15 mins
			});
		} else if (session) {
			// Refresh token expired - cleanup
			await prisma.session.delete({ where: { id: refreshToken } });
			event.cookies.delete('access_token', { path: '/' });
			event.cookies.delete('refresh_token', { path: '/' });
		}
	}

	if (userPayload) {
		event.locals.user = {
			id: userPayload.id as string,
			email: userPayload.email as string,
			name: userPayload.name as string | null,
			// We'll fetch these extra fields in layout load if needed,
			// but keeping basics in locals for easy access
			credits: 0,
			avatarUrl: null
		};
	} else {
		event.locals.user = null;
	}

	// Protect dashboard routes
	if (event.url.pathname.startsWith('/dashboard') && !event.locals.user) {
		return Response.redirect(new URL('/login', event.url), 303);
	}

	return resolve(event);
};
