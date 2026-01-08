import { AuthService } from '$lib/server/services/AuthService';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

const authService = new AuthService();

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		try {
			await authService.register({ email, password });
		} catch (error: any) {
			return fail(400, {
				message: error.message,
				email
			});
		}

		throw redirect(303, '/');
	}
};
