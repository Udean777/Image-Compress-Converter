import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { prisma as db } from '$lib/server/db';
import { uploadFile } from '$lib/server/s3';
import bcrypt from 'bcryptjs';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		throw redirect(302, '/dashboard/settings');
	}

	const user = await db.user.findUnique({
		where: { id: locals.user.id },
		select: {
			id: true,
			email: true,
			name: true,
			credits: true,
			avatarUrl: true
		}
	});

	if (!user) {
		throw redirect(302, '/');
	}

	return {
		user
	};
};

export const actions: Actions = {
	updateProfile: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthorized' });
		const data = await request.formData();
		const name = data.get('name') as string;
		if (!name) return fail(400, { message: 'Name is required' });
		try {
			const updatedUser = await db.user.update({
				where: { id: locals.user.id },
				data: { name },
				select: { id: true, email: true, name: true, credits: true, avatarUrl: true }
			});
			return { success: true, message: 'Profile updated successfully', user: updatedUser };
		} catch (error) {
			return fail(500, { message: 'Failed to update profile' });
		}
	},

	updateAvatar: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthorized' });
		const data = await request.formData();
		const file = data.get('avatar') as File;
		if (!file || file.size === 0) return fail(400, { message: 'No file uploaded' });
		try {
			const ext = file.name.split('.').pop();
			const fileName = `avatars/${locals.user.id}-${Date.now()}.${ext}`;
			const url = await uploadFile(file, fileName, file.type);
			await db.user.update({ where: { id: locals.user.id }, data: { avatarUrl: url } });
			return { success: true, message: 'Avatar updated successfully' };
		} catch (error) {
			return fail(500, { message: 'Failed to update avatar' });
		}
	},

	updatePassword: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthorized' });
		const data = await request.formData();
		const currentPassword = data.get('currentPassword') as string;
		const newPassword = data.get('newPassword') as string;
		const confirmPassword = data.get('confirmPassword') as string;
		if (!currentPassword || !newPassword || !confirmPassword)
			return fail(400, { message: 'All fields are required' });
		if (newPassword !== confirmPassword)
			return fail(400, { message: 'New passwords do not match' });
		try {
			const user = await db.user.findUnique({ where: { id: locals.user.id } });
			if (!user) return fail(404, { message: 'User not found' });
			let isValid = await bcrypt.compare(currentPassword, user.password);
			if (!isValid) return fail(400, { message: 'Incorrect current password' });
			const hashedPassword = await bcrypt.hash(newPassword, 10);
			await db.user.update({ where: { id: locals.user.id }, data: { password: hashedPassword } });
			return { success: true, message: 'Password updated successfully' };
		} catch (error) {
			return fail(500, { message: 'Failed to update password' });
		}
	},

	logout: async ({ cookies }) => {
		const { performLogout } = await import('$lib/server/auth');
		await performLogout(cookies);
	}
};
