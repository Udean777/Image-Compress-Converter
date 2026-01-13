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
		const activeSub = await prisma.subscription.findFirst({
			where: {
				userId: userPayload.id as string,
				status: { in: ['active', 'cancelled'] },
				currentPeriodEnd: { gte: new Date() }
			},
			include: { plan: true },
			orderBy: { createdAt: 'desc' }
		});

		event.locals.user = {
			id: userPayload.id as string,
			email: userPayload.email as string,
			name: userPayload.name as string | null,
			credits: 0,
			avatarUrl: null,
			role: (userPayload.role as string) || 'USER',
			planTier: activeSub?.plan.name || 'free'
		};
	} else {
		event.locals.user = null;
	}

	const impersonateId = event.cookies.get('impersonate_user_id');
	if (impersonateId && event.locals.user?.role === 'ADMIN') {
		const impersonatedUser = await prisma.user.findUnique({
			where: { id: impersonateId },
			include: {
				subscriptions: {
					where: {
						status: { in: ['active', 'cancelled'] },
						currentPeriodEnd: { gte: new Date() }
					},
					include: { plan: true },
					orderBy: { createdAt: 'desc' },
					take: 1
				}
			}
		});

		if (impersonatedUser) {
			event.locals.adminUser = { ...event.locals.user };
			event.locals.user = {
				id: impersonatedUser.id,
				email: impersonatedUser.email,
				name: impersonatedUser.name,
				credits: impersonatedUser.credits,
				avatarUrl: impersonatedUser.avatarUrl,
				role: impersonatedUser.role,
				isImpersonating: true,
				planTier: impersonatedUser.subscriptions[0]?.plan.name || 'free'
			};
		}
	}

	let isMaintenance = false;
	try {
		if (prisma.systemConfig) {
			const maintenanceConfig = await (prisma as any).systemConfig.findUnique({
				where: { key: 'maintenance_mode' }
			});
			isMaintenance = maintenanceConfig?.value === 'true';
		}
	} catch (error) {
		console.error('Maintenance check failed:', error);
	}

	if (
		isMaintenance &&
		event.locals.user?.role !== 'ADMIN' &&
		event.url.pathname !== '/maintenance'
	) {
		if (event.url.pathname.startsWith('/admin') || event.url.pathname.startsWith('/dashboard')) {
			throw redirect(303, '/maintenance');
		}
	} else if (!isMaintenance && event.url.pathname === '/maintenance') {
		throw redirect(303, event.locals.user ? '/' : '/');
	}

	if (event.url.pathname.startsWith('/admin')) {
		if (!event.locals.user) {
			throw redirect(303, '/');
		}

		if (event.locals.user.role !== 'ADMIN') {
			throw redirect(303, '/dashboard');
		}
	}

	if (event.url.pathname.startsWith('/dashboard') && !event.locals.user) {
		return Response.redirect(new URL('/', event.url), 303);
	}

	return resolve(event);
};
