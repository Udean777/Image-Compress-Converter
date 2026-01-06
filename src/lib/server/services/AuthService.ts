import { prisma } from '../db';
import { LogExecution } from '../decorators';
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

		const hashedPassword = await Bun.password.hash(input.password);

		const newUser = await this.db.user.create({
			data: {
				email: input.email,
				password: hashedPassword,
				credits: 10
			}
		});

		const { password, ...userWithoutPassword } = newUser;

		return {
			success: true,
			user: userWithoutPassword
		};
	}

	@LogExecution
	async login(input: ILoginInput): Promise<IAuthResponse> {
		const user = await this.db.user.findUnique({
			where: {
				email: input.email
			}
		});

		if (!user) {
			throw new Error(AuthError.INVALID_CREDENTIALS);
		}

		const isValid = await Bun.password.verify(input.password, user.password);
		if (!isValid) {
			throw new Error(AuthError.INVALID_CREDENTIALS);
		}

		const sessionId = crypto.randomUUID();
		const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

		await this.db.session.create({
			data: {
				id: sessionId,
				userId: user.id,
				expiresAt
			}
		});

		const { password, ...userWithoutPassword } = user;

		return {
			success: true,
			user: userWithoutPassword,
			sessionId
		};
	}
}
