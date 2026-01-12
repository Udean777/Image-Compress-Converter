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
		this.db = prisma;
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

		let isValid = await bcrypt.compare(input.password, user.password);

		// Fallback for legacy bcryptjs hashes
		if (!isValid && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))) {
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
}
