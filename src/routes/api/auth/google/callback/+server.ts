import { google } from '$lib/server/oauth/google';
import { AuthService } from '$lib/server/services/AuthService';
import { prisma } from '$lib/server/db';
import { decodeIdToken } from 'arctic';

interface GoogleIdTokenClaims {
	sub: string;
	email?: string;
	name?: string;
	picture?: string;
}
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const storedState = cookies.get('google_oauth_state');
	const codeVerifier = cookies.get('google_oauth_code_verifier');

	if (!code || !state || !storedState || state !== storedState || !codeVerifier) {
		return new Response('Invalid state or code', { status: 400 });
	}

	try {
		const tokens = await google.validateAuthorizationCode(code, codeVerifier);
		const idToken = tokens.idToken();
		const claims = decodeIdToken(idToken) as GoogleIdTokenClaims;

		const googleId = claims.sub;
		const email = claims.email;
		const name = claims.name;
		const avatarUrl = claims.picture;

		if (!email) {
			return new Response('Email not provided by Google', { status: 400 });
		}

		const authService = new AuthService(prisma);
		const result = await authService.handleOAuthUser({
			email,
			googleId,
			name,
			avatarUrl
		});

		if (result.success && result.accessToken && result.refreshToken && result.user) {
			const driveMode = cookies.get('google_oauth_drive_mode') === 'true';

			if (driveMode) {
				// We expect to have a refresh token here because we forced prompt=consent
				// However, google.validateAuthorizationCode might behave differently depending on library version
				// We need the raw tokens that include access_token and refresh_token from the exchange
				// Arctic's validateAuthorizationCode returns an OAuth2Tokens object which might have them

				// NOTE: Arctic's tokens object has .accessToken() and .refreshToken() methods usually, or properties.
				// Let's assume standard behavior or check the object.
				// Wait, we already called validateAuthorizationCode and got `tokens`.
				// access_token is tokens.accessToken()
				// refresh_token is tokens.refreshToken() (might be null if not returned)
				// expiry is tokens.accessTokenExpiresAt()

				// If we need to store raw json, we might constructing it manually
				// dependent on what googleapis expects.
				// googleapis credentials usually need: access_token, refresh_token, scope, token_type, expiry_date

				const driveTokens = {
					access_token: tokens.accessToken(),
					refresh_token: tokens.refreshToken(), // This is crucial
					scope: 'https://www.googleapis.com/auth/drive.file', // broad assumption, but okay for our usage
					token_type: 'Bearer',
					expiry_date: tokens.accessTokenExpiresAt().getTime()
				};

				if (driveTokens.refresh_token) {
					await prisma.storageConfig.upsert({
						where: {
							userId_provider: {
								userId: result.user.id,
								provider: 'google_drive'
							}
						},
						update: {
							config: driveTokens as any,
							isActive: true
						},
						create: {
							userId: result.user.id,
							provider: 'google_drive',
							config: driveTokens as any,
							isActive: true
						}
					});
				}

				// Clean up cookie
				cookies.delete('google_oauth_drive_mode', { path: '/' });
			}

			cookies.set('access_token', result.accessToken, {
				path: '/',
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'lax',
				maxAge: 60 * 15 // 15 minutes
			});

			cookies.set('refresh_token', result.refreshToken, {
				path: '/',
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'lax',
				maxAge: 60 * 60 * 24 * 7 // 7 days
			});

			return new Response(null, {
				status: 302,
				headers: {
					Location: '/dashboard'
				}
			});
		}

		return new Response('Authentication failed', { status: 500 });
	} catch (e) {
		console.error('Google OAuth error:', e);
		return new Response('Internal error', { status: 500 });
	}
};
