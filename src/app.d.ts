declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: {
				id: string;
				email: string;
				credits: number;
				name: string | null;
				avatarUrl: string | null;
				role: string;
				isImpersonating?: boolean;
				planTier: string;
			} | null;
			adminUser?: {
				id: string;
				email: string;
				name: string | null;
				role: string;
			} | null;
			session: {
				id: string;
				userId: string;
				expiresAt: Date;
			} | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
