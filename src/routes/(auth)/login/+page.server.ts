import { AuthService } from '$lib/server/services/AuthService';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

const authService = new AuthService();

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		try {
			const result = await authService.login({ email, password });

			if (result.accessToken && result.refreshToken) {
				cookies.set('access_token', result.accessToken, {
					path: '/',
					httpOnly: true,
					sameSite: 'strict',
					secure: process.env.NODE_ENV === 'production',
					maxAge: 60 * 15 // 15 minutes
				});

				cookies.set('refresh_token', result.refreshToken, {
					path: '/',
					httpOnly: true,
					sameSite: 'strict',
					secure: process.env.NODE_ENV === 'production',
					maxAge: 60 * 60 * 24 * 7 // 7 days
				});
			}
		} catch (error: any) {
			return fail(400, {
				message: error.message,
				email
			});
		}

		throw redirect(303, '/dashboard');
	}
};
