import { google } from '$lib/server/oauth/google';
import { generateState, generateCodeVerifier } from 'arctic';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies, url: requestUrl }) => {
	const state = generateState();
	const codeVerifier = generateCodeVerifier();
	const connectDrive = requestUrl.searchParams.get('connect_drive') === 'true';

	const scopes = ['openid', 'profile', 'email'];
	if (connectDrive) {
		scopes.push('https://www.googleapis.com/auth/drive.file');
	}

	let url = google.createAuthorizationURL(state, codeVerifier, scopes);

	if (connectDrive) {
		// Force consent to ensure we get a refresh token
		url = new URL(url.toString() + '&access_type=offline&prompt=consent');

		cookies.set('google_oauth_drive_mode', 'true', {
			path: '/',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			maxAge: 60 * 10, // 10 minutes
			sameSite: 'lax'
		});
	}

	cookies.set('google_oauth_state', state, {
		path: '/',
		httpOnly: true,
		maxAge: 60 * 10, // 10 minutes
		sameSite: 'lax'
	});

	cookies.set('google_oauth_code_verifier', codeVerifier, {
		path: '/',
		httpOnly: true,
		maxAge: 60 * 10, // 10 minutes
		sameSite: 'lax'
	});

	return new Response(null, {
		status: 302,
		headers: {
			Location: url.toString()
		}
	});
};
