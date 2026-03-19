/**
 * Step 3 of FatSecret 3-legged OAuth 1.0 flow.
 *
 * GET /auth/fatsecret/callback?oauth_token=...&oauth_verifier=...
 *   → Reads oauth_token_secret from cookie (set in step 1)
 *   → Signs the request to FatSecret's access_token endpoint
 *   → Displays the final access_token and access_token_secret
 *
 * Copy the displayed values into .env as:
 *   FATSECRET_ACCESS_TOKEN=<access_token>
 *   FATSECRET_ACCESS_SECRET=<access_token_secret>
 *
 * Then restart the dev server and navigate to /weight.
 */

import type { RequestHandler } from './$types';
import { FATSECRET_CONSUMER_KEY, FATSECRET_CONSUMER_SECRET } from '$env/static/private';
import {
	FatSecretApi,
	FATSECRET_ACCESS_TOKEN_URL
} from '$lib/fatsecret';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const oauthToken = url.searchParams.get('oauth_token');
	const oauthVerifier = url.searchParams.get('oauth_verifier');
	const requestTokenSecret = cookies.get('fs_request_token_secret');

	if (!oauthToken || !oauthVerifier) {
		return new Response('Missing oauth_token or oauth_verifier in callback URL', { status: 400 });
	}

	if (!requestTokenSecret) {
		return new Response(
			'Missing request token secret cookie — did the session expire? Try /auth/fatsecret again.',
			{ status: 400 }
		);
	}

	// oauth_token and oauth_verifier are OAuth protocol params — pass them via extraOAuthParams
	// so they are included in both the signature base string AND the query string output.
	const oauthParams = FatSecretApi.buildOAuth1Params(
		'GET',
		FATSECRET_ACCESS_TOKEN_URL,
		{}, // no non-oauth request params
		FATSECRET_CONSUMER_KEY,
		FATSECRET_CONSUMER_SECRET,
		oauthToken,       // adds oauth_token to signed params
		requestTokenSecret,
		{ oauth_verifier: oauthVerifier } // must be in header/query AND in signature
	);

	const queryString = new URLSearchParams(oauthParams).toString();
	const response = await fetch(`${FATSECRET_ACCESS_TOKEN_URL}?${queryString}`);

	if (!response.ok) {
		const text = await response.text();
		return new Response(`FatSecret access_token error: ${text}`, { status: 502 });
	}

	const parsed = FatSecretApi.parseFormEncoded(await response.text());
	const { oauth_token: accessToken, oauth_token_secret: accessSecret } = parsed;

	if (!accessToken || !accessSecret) {
		return new Response(`Unexpected response: ${JSON.stringify(parsed)}`, { status: 502 });
	}

	// Clear the temporary cookie
	cookies.delete('fs_request_token_secret', { path: '/auth/fatsecret' });

	const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>FatSecret – Authorization Successful</title>
  <style>
    body { font-family: monospace; max-width: 640px; margin: 60px auto; padding: 0 24px; background: #0f172a; color: #f1f5f9; }
    h1 { color: #22d3ee; }
    p { color: #94a3b8; line-height: 1.6; }
    pre { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 20px; white-space: pre-wrap; word-break: break-all; }
    .key { color: #86efac; }
    .val { color: #fde68a; }
    .note { background: #312e81; border-left: 4px solid #6366f1; padding: 12px 16px; border-radius: 4px; margin-top: 24px; }
  </style>
</head>
<body>
  <h1>✓ Authorization successful</h1>
  <p>Copy the values below into your <code>.env</code> file, then restart the dev server.</p>
  <pre><span class="key">FATSECRET_ACCESS_TOKEN</span>=<span class="val">${accessToken}</span>
<span class="key">FATSECRET_ACCESS_SECRET</span>=<span class="val">${accessSecret}</span></pre>
  <div class="note">
    <p>Once added to <code>.env</code> and the server restarted, navigate to
    <a href="/weight" style="color:#818cf8">/weight</a> to see your weight data.</p>
  </div>
</body>
</html>`;

	return new Response(html, {
		headers: { 'Content-Type': 'text/html; charset=utf-8' }
	});
};
