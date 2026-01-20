import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/db';

export const load: PageServerLoad = async ({ params, locals }) => {
	const user = locals.user;
	if (!user) throw redirect(302, '/login');

	const paymentId = params.id;

	const payment = await prisma.payment.findUnique({
		where: { id: paymentId },
		include: {
			user: {
				select: {
					id: true,
					name: true,
					email: true
				}
			}
		}
	});

	if (!payment) {
		throw error(404, 'Invoice tidak ditemukan');
	}

	if (payment.userId !== user.id && user.role !== 'ADMIN') {
		throw error(403, 'Anda tidak memiliki akses ke invoice ini');
	}

	let subscription = null;
	if (payment.subscriptionId) {
		subscription = await prisma.subscription.findUnique({
			where: { id: payment.subscriptionId },
			include: {
				plan: true
			}
		});
	}

	return {
		payment,
		subscription,
		user: {
			name: user.name,
			email: user.email
		}
	};
};
