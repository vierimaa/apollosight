/**
 * Step 1 of FatSecret 3-legged OAuth 1.0 flow.
 *
 * GET /auth/fatsecret
 *   → Signs a request to FatSecret's request_token endpoint
 *   → Stores the temporary oauth_token_secret in a short-lived cookie
 *   → Redirects the user to FatSecret's authorization page
 *
 * After the user authorizes the app, FatSecret redirects them back to
 * /auth/fatsecret/callback with oauth_token and oauth_verifier.
 */

import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { FATSECRET_CONSUMER_KEY, FATSECRET_CONSUMER_SECRET } from '$env/static/private';
import {
	buildOAuth1Params,
	parseFormEncoded,
	FATSECRET_REQUEST_TOKEN_URL,
	FATSECRET_AUTHORIZE_URL
} from '$lib/fatsecret';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const callbackUrl = `${url.origin}/auth/fatsecret/callback`;

	// FatSecret's request_token endpoint expects all OAuth params in the POST body
	// (not in an Authorization header). Build signed params and send as form fields.
	const oauthParams = buildOAuth1Params(
		'POST',
		FATSECRET_REQUEST_TOKEN_URL,
		{},
		FATSECRET_CONSUMER_KEY,
		FATSECRET_CONSUMER_SECRET,
		'',
		'',
		{ oauth_callback: callbackUrl }
	);

	const response = await fetch(FATSECRET_REQUEST_TOKEN_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams(oauthParams)
	});

	if (!response.ok) {
		const text = await response.text();
		return new Response(`FatSecret request_token error: ${text}`, { status: 502 });
	}

	const parsed = parseFormEncoded(await response.text());
	const { oauth_token, oauth_token_secret } = parsed;

	if (!oauth_token || !oauth_token_secret) {
		return new Response('Missing oauth_token or oauth_token_secret in response', { status: 502 });
	}

	// Store the token secret in a short-lived HTTP-only cookie so the callback can use it
	cookies.set('fs_request_token_secret', oauth_token_secret, {
		path: '/auth/fatsecret',
		httpOnly: true,
		maxAge: 600, // 10 minutes
		sameSite: 'lax'
	});

	// Redirect the user to FatSecret's authorization page
	throw redirect(302, `${FATSECRET_AUTHORIZE_URL}?oauth_token=${oauth_token}`);
};
