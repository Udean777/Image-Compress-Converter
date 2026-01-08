import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/db';
import type { Cookies } from '@sveltejs/kit';

export async function performLogout(cookies: Cookies) {
	const sessionId = cookies.get('session');
	if (sessionId) {
		await prisma.session
			.delete({
				where: { id: sessionId }
			})
			.catch(() => {});
	}
	cookies.delete('session', { path: '/' });
	throw redirect(303, '/login');
}
