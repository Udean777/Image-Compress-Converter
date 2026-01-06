import type { Handle } from '@sveltejs/kit';
import { prisma } from '$lib/server/db';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get('session');

	if (!sessionId) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const session = await prisma.session.findUnique({
		where: { id: sessionId },
		include: { user: true }
	});

	if (!session) {
		event.cookies.delete('session', { path: '/' });
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	if (Date.now() >= session.expiresAt.getTime()) {
		await prisma.session.delete({ where: { id: sessionId } });
		event.cookies.delete('session', { path: '/' });
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	// Refresh session if needed (optional strategy, keeping it simple for now)

	event.locals.session = {
		id: session.id,
		userId: session.userId,
		expiresAt: session.expiresAt
	};

	event.locals.user = {
		id: session.user.id,
		email: session.user.email,
		credits: session.user.credits
	};

	if (event.url.pathname.startsWith('/dashboard') && !event.locals.user) {
		return Response.redirect(new URL('/login', event.url), 303);
	}

	return resolve(event);
};
