import { prisma } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
	const sessionId = cookies.get('session');
	if (!sessionId) throw redirect(303, '/login');

	const session = await prisma.session.findUnique({
		where: { id: sessionId },
		include: { user: true }
	});

	if (!session) throw redirect(303, '/login');

	return {
		user: {
			email: session.user.email,
			credits: session.user.credits,
			name: session.user.name,
			avatarUrl: session.user.avatarUrl
		}
	};
};
