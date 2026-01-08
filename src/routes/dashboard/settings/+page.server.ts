import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { prisma as db } from '$lib/server/db';
import { uploadFile } from '$lib/server/s3';
import bcrypt from 'bcryptjs';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/');
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
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized' });
		}

		const data = await request.formData();
		const name = data.get('name') as string;

		if (!name) {
			return fail(400, { message: 'Name is required' });
		}

		try {
			const updatedUser = await db.user.update({
				where: { id: locals.user.id },
				data: { name },
				select: {
					id: true,
					email: true,
					name: true,
					credits: true,
					avatarUrl: true
				}
			});

			return {
				success: true,
				message: 'Profile updated successfully',
				user: updatedUser
			};
		} catch (error) {
			console.error('Update profile error:', error);
			return fail(500, { message: 'Failed to update profile' });
		}
	},

	updateAvatar: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized' });
		}

		const data = await request.formData();
		const file = data.get('avatar') as File;

		if (!file || file.size === 0) {
			return fail(400, { message: 'No file uploaded' });
		}

		if (!file.type.startsWith('image/')) {
			return fail(400, { message: 'File must be an image' });
		}

		if (file.size > 5 * 1024 * 1024) {
			// 5MB limit
			return fail(400, { message: 'File size must be less than 5MB' });
		}

		try {
			const ext = file.name.split('.').pop();
			const fileName = `avatars/${locals.user.id}-${Date.now()}.${ext}`;
			const url = await uploadFile(file, fileName, file.type);

			await db.user.update({
				where: { id: locals.user.id },
				data: { avatarUrl: url }
			});

			return { success: true, message: 'Avatar updated successfully' };
		} catch (error) {
			console.error('Update avatar error:', error);
			return fail(500, { message: 'Failed to update avatar' });
		}
	},

	updatePassword: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized' });
		}

		const data = await request.formData();
		const currentPassword = data.get('currentPassword') as string;
		const newPassword = data.get('newPassword') as string;
		const confirmPassword = data.get('confirmPassword') as string;

		if (!currentPassword || !newPassword || !confirmPassword) {
			return fail(400, { message: 'All fields are required' });
		}

		if (newPassword !== confirmPassword) {
			return fail(400, { message: 'New passwords do not match' });
		}

		if (newPassword.length < 6) {
			return fail(400, { message: 'Password must be at least 6 characters' });
		}

		try {
			const user = await db.user.findUnique({
				where: { id: locals.user.id }
			});

			if (!user) {
				return fail(404, { message: 'User not found' });
			}

			// 1. Try Bun.password.verify (Standard for Argon2/Bun bcrypt)
			let isValid = await Bun.password.verify(currentPassword, user.password);
			let needsMigration = false;

			// 2. Fallback to bcryptjs (Support legacy hashes if Bun.password fails)
			if (!isValid && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))) {
				isValid = await bcrypt.compare(currentPassword, user.password);
				if (isValid) {
					needsMigration = true;
				}
			}

			if (!isValid) {
				return fail(400, { message: 'Incorrect current password' });
			}

			// If we matched a legacy hash, migrate it before setting the new one
			// Or just set the new one below anyway.
			// But if the user somehow failed the new password update below,
			// we at least migrated them.

			const hashedPassword = await Bun.password.hash(newPassword);

			await db.user.update({
				where: { id: locals.user.id },
				data: { password: hashedPassword }
			});

			return { success: true, message: 'Password updated successfully' };
		} catch (error) {
			console.error('Update password error:', error);
			return fail(500, { message: 'Failed to update password' });
		}
	},

	deleteAccount: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized' });
		}

		const data = await request.formData();
		const password = data.get('password') as string;

		if (!password) {
			return fail(400, { message: 'Password is required' });
		}

		try {
			const user = await db.user.findUnique({
				where: { id: locals.user.id }
			});

			if (!user) {
				return fail(404, { message: 'User not found' });
			}

			// Verify password
			let isValid = await Bun.password.verify(password, user.password);

			// Fallback to bcryptjs for legacy hashes
			if (!isValid && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))) {
				isValid = await bcrypt.compare(password, user.password);
			}

			if (!isValid) {
				return fail(400, { message: 'Incorrect password' });
			}

			await db.user.delete({
				where: { id: locals.user.id }
			});

			// In a real app, you would also delete sessions, files from S3, etc.
		} catch (error) {
			console.error('Delete account error:', error);
			return fail(500, { message: 'Failed to delete account' });
		}

		throw redirect(302, '/');
	},

	logout: async ({ cookies }) => {
		const { performLogout } = await import('$lib/server/auth');
		await performLogout(cookies);
	}
};
