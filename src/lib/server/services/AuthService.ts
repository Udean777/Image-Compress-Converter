import { prisma } from '../db';
import { LogExecution } from '../decorators';
import bcrypt from 'bcryptjs';
import {
	AuthError,
	type IAuthResponse,
	type ILoginInput,
	type IRegisterInput
} from '$lib/types/auth.types';
import type { PrismaClient } from '@prisma/client';

export class AuthService {
	private db: PrismaClient;

	constructor(database: PrismaClient = prisma) {
		this.db = database;
	}

	@LogExecution
	async register(input: IRegisterInput): Promise<IAuthResponse> {
		if (!input.email || !input.password) {
			throw new Error(AuthError.MISSING_FIELDS);
		}
		if (input.password.length < 6) {
			throw new Error(AuthError.WEAK_PASSWORD);
		}

		const existing = await this.db.user.findUnique({
			where: {
				email: input.email
			}
		});

		if (existing) {
			throw new Error(AuthError.EMAIL_EXISTS);
		}

		const hashedPassword = await bcrypt.hash(input.password, 10);

		const newUser = await this.db.user.create({
			data: {
				email: input.email,
				password: hashedPassword,
				credits: 15
			}
		});

		const { password, ...userWithoutPassword } = newUser;

		return {
			success: true,
			user: userWithoutPassword
		};
	}

	async login(input: ILoginInput): Promise<IAuthResponse> {
		const user = await this.db.user.findUnique({
			where: { email: input.email }
		});

		if (!user) {
			throw new Error(AuthError.INVALID_CREDENTIALS);
		}

		if (!user.password) {
			throw new Error(AuthError.INVALID_CREDENTIALS);
		}

		let isValid = await bcrypt.compare(input.password, user.password);

		// Fallback for legacy bcryptjs hashes
		if (
			!isValid &&
			user.password &&
			(user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))
		) {
			isValid = await bcrypt.compare(input.password, user.password);
		}

		if (!isValid) {
			throw new Error(AuthError.INVALID_CREDENTIALS);
		}

		// Issue JWT tokens
		const { createAccessToken, createRefreshToken } = await import('../jwt');
		const accessToken = await createAccessToken(user);
		const refreshToken = await createRefreshToken(user.id);

		const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days

		await this.db.session.create({
			data: {
				id: refreshToken,
				userId: user.id,
				expiresAt
			}
		});

		const { password, ...userWithoutPassword } = user;

		return {
			success: true,
			user: userWithoutPassword,
			accessToken,
			refreshToken
		};
	}
	private async downloadAndUploadAvatar(url: string, userId: string): Promise<string | null> {
		try {
			const response = await fetch(url);
			if (!response.ok) return null;

			const arrayBuffer = await response.arrayBuffer();
			const buffer = Buffer.from(arrayBuffer);
			const contentType = response.headers.get('content-type') || 'image/jpeg';
			const ext = contentType.split('/')[1] || 'jpg';

			const { uploadBuffer } = await import('../s3');
			const key = `avatars/${userId}-${Date.now()}.${ext}`;

			return await uploadBuffer(buffer, key, contentType);
		} catch (error) {
			console.error('Failed to download/upload avatar:', error);
			return null;
		}
	}

	@LogExecution
	async handleOAuthUser(input: {
		email: string;
		name?: string;
		avatarUrl?: string;
		googleId: string;
	}): Promise<IAuthResponse> {
		let user = await this.db.user.findFirst({
			where: {
				OR: [{ googleId: input.googleId }, { email: input.email }]
			}
		});

		// Helper to prepare avatar URL
		let finalAvatarUrl = input.avatarUrl;

		// We need a user ID to generate the S3 key, so we might need to do this after creation/funding user
		// But we really want to do it before if possible, or update after.
		// If user exists, we have ID. If not, we don't.
		// Strategy: Create/Get user first, THEN sync avatar if needed.

		if (!user) {
			// Create new user
			user = await this.db.user.create({
				data: {
					email: input.email,
					name: input.name,
					// avatarUrl: input.avatarUrl, // Don't set yet, wait for sync
					googleId: input.googleId,
					credits: 15
				}
			});

			if (input.avatarUrl) {
				const s3Url = await this.downloadAndUploadAvatar(input.avatarUrl, user.id);
				if (s3Url) {
					user = await this.db.user.update({
						where: { id: user.id },
						data: { avatarUrl: s3Url }
					});
				} else {
					// Fallback to google url if upload fails
					user = await this.db.user.update({
						where: { id: user.id },
						data: { avatarUrl: input.avatarUrl }
					});
				}
			}
		} else {
			// Existing user
			const updateData: any = {};

			if (!user.googleId) {
				updateData.googleId = input.googleId;
			}

			// Sync Avatar logic:
			// If input has avatar, AND (current avatar is null OR current avatar is a google url)
			// We want to replace unreliable google URLs with our S3 ones.
			if (input.avatarUrl) {
				const isGoogleAvatar = user.avatarUrl?.includes('googleusercontent.com');
				if (!user.avatarUrl || isGoogleAvatar) {
					const s3Url = await this.downloadAndUploadAvatar(input.avatarUrl, user.id);
					if (s3Url) {
						updateData.avatarUrl = s3Url;
					} else if (!user.avatarUrl) {
						// Fallback only if we don't have ANY avatar
						updateData.avatarUrl = input.avatarUrl;
					}
				}
			}

			if (Object.keys(updateData).length > 0) {
				user = await this.db.user.update({
					where: { id: user.id },
					data: updateData
				});
			}
		}

		// Issue JWT tokens
		const { createAccessToken, createRefreshToken } = await import('../jwt');
		const accessToken = await createAccessToken(user);
		const refreshToken = await createRefreshToken(user.id);

		const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days

		await this.db.session.create({
			data: {
				id: refreshToken,
				userId: user.id,
				expiresAt
			}
		});

		const { password, ...userWithoutPassword } = user;

		return {
			success: true,
			user: userWithoutPassword,
			accessToken,
			refreshToken
		};
	}
}
