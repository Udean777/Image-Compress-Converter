import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/db';
import type { Cookies } from '@sveltejs/kit';

export async function performLogout(cookies: Cookies) {
	const refreshToken = cookies.get('refresh_token');
	if (refreshToken) {
		await prisma.session
			.delete({
				where: { id: refreshToken }
			})
			.catch(() => {});
	}
	cookies.delete('access_token', { path: '/' });
	cookies.delete('refresh_token', { path: '/' });
	throw redirect(303, '/');
}
