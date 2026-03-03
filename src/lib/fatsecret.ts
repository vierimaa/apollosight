/**
 * FatSecret Platform API – OAuth 1.0 helper utilities.
 *
 * FatSecret's weight diary endpoints (weights.get_month.v2) require
 * OAuth 1.0 HMAC-SHA1 signed *and delegated* requests (3-legged OAuth).
 * OAuth 2.0 is only supported for generic food/recipe lookups, NOT for
 * user-specific data.
 *
 * References:
 *  - https://platform.fatsecret.com/docs/guides/authentication/oauth1
 *  - https://platform.fatsecret.com/docs/guides/authentication/oauth1/three-legged
 *  - https://platform.fatsecret.com/docs/v2/weights.get_month
 */

import { createHmac, randomBytes } from 'node:crypto';
import type { WeightEntry } from './types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const FATSECRET_API_URL = 'https://platform.fatsecret.com/rest/server.api';
export const FATSECRET_REQUEST_TOKEN_URL =
	'https://authentication.fatsecret.com/oauth/request_token';
export const FATSECRET_AUTHORIZE_URL = 'https://authentication.fatsecret.com/oauth/authorize';
export const FATSECRET_ACCESS_TOKEN_URL =
	'https://authentication.fatsecret.com/oauth/access_token';

/**
 * Days elapsed since Unix epoch (Jan 1 1970) for a given Date.
 * FatSecret uses this as the `date` parameter to select a month.
 */
export const dateToDayInt = (date: Date): number => Math.floor(date.getTime() / 86_400_000);

/**
 * Convert a FatSecret day_int back to a JS Date (midnight UTC).
 */
export const dayIntToDate = (dayInt: number): Date => new Date(dayInt * 86_400_000);

/**
 * Convert a FatSecret day_int to an ISO 8601 date string (YYYY-MM-DD).
 */
export const dayIntToIso = (dayInt: number): string =>
	dayIntToDate(dayInt).toISOString().slice(0, 10);

// ---------------------------------------------------------------------------
// OAuth 1.0 Signing
// ---------------------------------------------------------------------------

const percentEncode = (value: string): string =>
	encodeURIComponent(value).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());

/**
 * Build a random nonce string.
 */
const generateNonce = (): string => randomBytes(16).toString('hex');

/**
 * Build the OAuth 1.0 signature base string.
 *
 * @param method     HTTP method (GET, POST) – uppercased
 * @param url        Request URL without query string
 * @param allParams  All parameters: oauth_ metadata + request-specific params
 */
const buildSignatureBaseString = (
	method: string,
	url: string,
	allParams: Record<string, string>
): string => {
	const sortedParams = Object.entries(allParams)
		.sort(([keyA, valA], [keyB, valB]) => {
			if (keyA < keyB) return -1;
			if (keyA > keyB) return 1;
			if (valA < valB) return -1;
			if (valA > valB) return 1;
			return 0;
		})
		.map(([key, value]) => `${percentEncode(key)}=${percentEncode(value)}`)
		.join('&');

	return `${method.toUpperCase()}&${percentEncode(url)}&${percentEncode(sortedParams)}`;
};

/**
 * Sign an OAuth 1.0 HMAC-SHA1 request and return the full Authorization header value.
 *
 * @param method          HTTP method
 * @param url             Request URL (no query string)
 * @param requestParams   Non-oauth request parameters (e.g. { method: 'weights.get_month.v2', format: 'json' })
 * @param consumerKey     Your app's Consumer Key
 * @param consumerSecret  Your app's Consumer Secret
 * @param accessToken       User's Access Token (empty string for request-token step)
 * @param accessSecret      User's Access Token Secret (empty string for request-token step)
 * @param extraOAuthParams  Additional OAuth protocol params that must appear in the
 *                          Authorization header AND in the signature base string
 *                          (e.g. { oauth_callback: '...' } for the request-token step).
 */
export const buildOAuth1Header = (
	method: string,
	url: string,
	requestParams: Record<string, string>,
	consumerKey: string,
	consumerSecret: string,
	accessToken = '',
	accessSecret = '',
	extraOAuthParams: Record<string, string> = {}
): string => {
	const oauthParams = buildOAuth1Params(
		method,
		url,
		requestParams,
		consumerKey,
		consumerSecret,
		accessToken,
		accessSecret,
		extraOAuthParams
	);

	return (
		'OAuth ' +
		Object.entries(oauthParams)
			.map(([key, value]) => `${key}="${percentEncode(value)}"`)
			.join(', ')
	);
};

/**
 * Build a signed OAuth 1.0 params object suitable for the POST body or query string.
 * Used for the authentication endpoints (request_token, access_token) which expect
 * all OAuth params as form-encoded body fields, not in an Authorization header.
 */
export const buildOAuth1Params = (
	method: string,
	url: string,
	requestParams: Record<string, string>,
	consumerKey: string,
	consumerSecret: string,
	accessToken = '',
	accessSecret = '',
	extraOAuthParams: Record<string, string> = {}
): Record<string, string> => {
	const timestamp = Math.floor(Date.now() / 1000).toString();
	const nonce = generateNonce();

	const oauthParams: Record<string, string> = {
		oauth_consumer_key: consumerKey,
		oauth_nonce: nonce,
		oauth_signature_method: 'HMAC-SHA1',
		oauth_timestamp: timestamp,
		oauth_version: '1.0',
		...extraOAuthParams
	};

	if (accessToken) {
		oauthParams.oauth_token = accessToken;
	}

	// All params combined for signing
	const allParams = { ...oauthParams, ...requestParams };
	const baseString = buildSignatureBaseString(method, url, allParams);

	// Signing key: consumer_secret& (token_secret may be empty)
	const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(accessSecret)}`;
	const signature = createHmac('sha1', signingKey).update(baseString).digest('base64');

	oauthParams.oauth_signature = signature;

	return oauthParams;
};

/**
 * Parse an application/x-www-form-urlencoded response body into a key/value map.
 */
export const parseFormEncoded = (body: string): Record<string, string> =>
	Object.fromEntries(new URLSearchParams(body));

// ---------------------------------------------------------------------------
// Weight data fetching
// ---------------------------------------------------------------------------

/**
 * Fetch all weight entries for a given month from FatSecret.
 *
 * @param dateInMonth  Any Date within the desired month
 * @param consumerKey
 * @param consumerSecret
 * @param accessToken
 * @param accessSecret
 */
export const fetchWeightMonth = async (
	dateInMonth: Date,
	consumerKey: string,
	consumerSecret: string,
	accessToken: string,
	accessSecret: string
): Promise<WeightEntry[]> => {
	const dayInt = dateToDayInt(dateInMonth).toString();
	const requestParams = {
		method: 'weights.get_month.v2',
		format: 'json',
		date: dayInt
	};

	// FatSecret OAuth 1.0 API calls (GET) — send all OAuth + request params in the query string.
	const allSignedParams = buildOAuth1Params(
		'GET',
		FATSECRET_API_URL,
		requestParams,
		consumerKey,
		consumerSecret,
		accessToken,
		accessSecret
	);

	// allSignedParams contains only oauth_* keys; merge with requestParams for the full query string.
	const queryString = new URLSearchParams({ ...requestParams, ...allSignedParams }).toString();
	const response = await fetch(`${FATSECRET_API_URL}?${queryString}`);

	if (!response.ok) {
		throw new Error(`FatSecret API error: ${response.status} ${response.statusText}`);
	}

	const json = await response.json();

	// If no weight recorded for this month FatSecret returns { month: {} } or error 2
	const month = json?.month;
	if (!month || !month.day) return [];

	// day may be a single object or an array
	const days: Array<{ date_int: string; weight_kg: string; weight_comment?: string }> = Array.isArray(
		month.day
	)
		? month.day
		: [month.day];

	return days.map((day) => ({
		date_int: Number(day.date_int),
		date: dayIntToIso(Number(day.date_int)),
		weight_kg: parseFloat(day.weight_kg),
		weight_comment: day.weight_comment
	}));
};
