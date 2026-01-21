import { redirect } from '@sveltejs/kit';
import { generateState, generateCodeVerifier } from 'arctic';
import { google } from '$lib/server/oauth/google';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies, url: requestUrl, locals }) => {
	const state = generateState();
	const codeVerifier = generateCodeVerifier();

	const url = await google.createAuthorizationURL(state, codeVerifier, [
		'openid',
		'email',
		'profile',
		'https://www.googleapis.com/auth/drive.file'
	]);

    url.searchParams.set('access_type', 'offline');
    url.searchParams.set('prompt', 'consent');

	cookies.set('google_oauth_state', state, {
		path: '/',
		secure: process.env.NODE_ENV === 'production',
		httpOnly: true,
		maxAge: 60 * 10,
		sameSite: 'lax'
	});

	cookies.set('google_oauth_code_verifier', codeVerifier, {
		path: '/',
		secure: process.env.NODE_ENV === 'production',
		httpOnly: true,
		maxAge: 60 * 10,
		sameSite: 'lax'
	});

    // Check for drive connection mode
    const isDriveConnect = requestUrl.searchParams.get('connect') === 'drive';
    if (isDriveConnect) {
        // Enforce Pro check for drive connection
        // Note: locals.user is populated by hooks.server.ts
        // If user is not logged in, they will be redirected to login anyway?
        // But if they are logged in as free user, we must block.
        const user = locals.user;
        if (!user || user.planTier === 'free') {
             // Redirect to upgrade page if generic free user tries to connect drive
             return new Response(null, {
                status: 302,
                headers: { Location: '/dashboard/subscription?error=pro_required' }
             });
        }

        cookies.set('google_oauth_drive_mode', 'true', {
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            maxAge: 60 * 10,
            sameSite: 'lax'
        });
    }

	throw redirect(302, url.toString());
};
