import { redirect, type Handle } from '@sveltejs/kit';
import { prisma } from '$lib/server/db';
import { ensurePublicBucket } from '$lib/server/s3';
import { verifyToken, createAccessToken } from '$lib/server/jwt';

ensurePublicBucket().catch(console.error);

export const handle: Handle = async ({ event, resolve }) => {
	const accessToken = event.cookies.get('access_token');
	const refreshToken = event.cookies.get('refresh_token');

	let userPayload = accessToken ? await verifyToken(accessToken) : null;

	if (!userPayload && refreshToken) {
		const session = await prisma.session.findUnique({
			where: { id: refreshToken },
			include: { user: true }
		});

		if (session && Date.now() < session.expiresAt.getTime()) {
			const user = session.user;
			userPayload = { id: user.id, email: user.email, name: user.name, role: user.role };

			const newAccessToken = await createAccessToken(user);
			event.cookies.set('access_token', newAccessToken, {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				secure: process.env.NODE_ENV === 'production',
				maxAge: 60 * 15
			});
		} else if (session) {
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
			credits: 0,
			avatarUrl: null,
			role: (userPayload.role as string) || 'USER'
		};
	} else {
		event.locals.user = null;
	}

	if (event.url.pathname.startsWith('/admin')) {
		if (!event.locals.user) {
			throw redirect(303, '/');
		}

		console.log(event.locals.user.role);
		if (event.locals.user.role !== 'ADMIN') {
			throw redirect(303, '/dashboard');
		}
	}

	if (event.url.pathname.startsWith('/dashboard') && !event.locals.user) {
		return Response.redirect(new URL('/', event.url), 303);
	}

	return resolve(event);
};
