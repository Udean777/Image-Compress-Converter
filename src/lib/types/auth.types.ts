import type { User } from '@prisma/client';

export interface IRegisterInput {
	email: string;
	password: string;
}

export interface ILoginInput {
	email: string;
	password: string;
}

export interface IAuthResponse {
	success: boolean;
	user?: Omit<User, 'password'>;
	sessionId?: string;
	message?: string;
}

export enum AuthError {
	EMAIL_EXISTS = 'Email already registered',
	INVALID_CREDENTIALS = 'Invalid email or password',
	WEAK_PASSWORD = 'Password must be at least 6 characters',
	SERVER_ERROR = 'Internal server error',
	MISSING_FIELDS = 'Please fill in all fields'
}
