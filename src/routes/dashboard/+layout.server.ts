import { prisma } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(303, '/');

	const user = await prisma.user.findUnique({
		where: { id: locals.user.id },
		select: {
			email: true,
			credits: true,
			name: true,
			avatarUrl: true
		}
	});

	if (!user) throw redirect(303, '/');

	return {
		user
	};
};
