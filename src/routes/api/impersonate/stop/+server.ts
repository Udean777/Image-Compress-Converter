import { redirect } from '@sveltejs/kit';

export const POST = async ({ cookies }) => {
	cookies.delete('impersonate_user_id', { path: '/' });
	throw redirect(303, '/admin/users');
};
