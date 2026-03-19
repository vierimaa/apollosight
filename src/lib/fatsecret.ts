/**
 * FatSecret Platform API  OAuth 1.0 helper utilities.
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
import type { WeightEntry, NutritionEntry } from './types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const FATSECRET_API_URL = 'https://platform.fatsecret.com/rest/server.api';
export const FATSECRET_REQUEST_TOKEN_URL =
	'https://authentication.fatsecret.com/oauth/request_token';
export const FATSECRET_AUTHORIZE_URL = 'https://authentication.fatsecret.com/oauth/authorize';
export const FATSECRET_ACCESS_TOKEN_URL =
	'https://authentication.fatsecret.com/oauth/access_token';

// ---------------------------------------------------------------------------
// FatSecretApi
// ---------------------------------------------------------------------------

/**
 * Client for the FatSecret Platform REST API.
 *
 * Static methods cover OAuth 1.0 signing and helper utilities used during
 * the 3-legged handshake (before access tokens exist).
 *
 * Instance methods provide authenticated access to user-specific endpoints
 * (weight diary, food diary, etc.).
 */
export class FatSecretApi {
	constructor(
		private readonly consumerKey: string,
		private readonly consumerSecret: string,
		private readonly accessToken: string,
		private readonly accessSecret: string
	) { }

	// -------------------------------------------------------------------------
	// Static: date helpers
	// -------------------------------------------------------------------------

	/**
	 * Days elapsed since Unix epoch (Jan 1 1970) for a given Date.
	 * FatSecret uses this integer as the `date` parameter to select a month.
	 */
	private static dateToDayInt(date: Date): number {
		return Math.floor(date.getTime() / 86_400_000);
	}

	/** Convert a FatSecret day_int to an ISO 8601 date string (YYYY-MM-DD). */
	private static dayIntToIso(dayInt: number): string {
		return new Date(dayInt * 86_400_000).toISOString().slice(0, 10);
	}

	// -------------------------------------------------------------------------
	// Static: OAuth 1.0 signing
	// -------------------------------------------------------------------------

	private static percentEncode(value: string): string {
		// encodeURIComponent does not encode !, ', (, ), * — but OAuth RFC 5849 requires it.
		return encodeURIComponent(value).replace(
			/[!'()*]/g,
			(char) => '%' + char.charCodeAt(0).toString(16).toUpperCase()
		);
	}

	/**
	 * Build the OAuth 1.0 HMAC-SHA1 signature base string (RFC 5849 §3.4.1).
	 *
	 * OAuth requires signing a single canonical string so that both sides
	 * (client and server) independently produce the same bytes to sign.
	 * It is assembled from three percent-encoded components joined by "&":
	 *   1. HTTP method — uppercased (e.g. "GET")
	 *   2. Base URL    — scheme + host + path, no query string
	 *   3. Parameters  — every OAuth + request param, sorted by key then value,
	 *                    serialised as key=value pairs joined by "&", then the
	 *                    whole string is percent-encoded a second time
	 *
	 * Any deviation from this exact format produces the wrong signature and
	 * the server will reject the request with a 401.
	 */
	private static buildSignatureBaseString(
		method: string,
		url: string,
		allParams: Record<string, string>
	): string {
		// Sort by key, break ties by value, then encode every key=value pair
		const normalizedParams = Object.entries(allParams)
			.sort(([keyA, valA], [keyB, valB]) => {
				if (keyA !== keyB) return keyA < keyB ? -1 : 1;
				return valA < valB ? -1 : valA > valB ? 1 : 0;
			})
			.map(([key, value]) => `${FatSecretApi.percentEncode(key)}=${FatSecretApi.percentEncode(value)}`)
			.join('&');

		// Each component is percent-encoded, then the three are joined by "&"
		return [
			method.toUpperCase(),
			FatSecretApi.percentEncode(url),
			FatSecretApi.percentEncode(normalizedParams)
		].join('&');
	}

	/**
	 * Build a signed OAuth 1.0 params object suitable for the POST body or
	 * query string. Used by the auth handshake routes (request_token,
	 * access_token) which send OAuth params as form-encoded body fields.
	 */
	public static buildOAuth1Params(
		method: string,
		url: string,
		requestParams: Record<string, string>,
		consumerKey: string,
		consumerSecret: string,
		accessToken = '',
		accessSecret = '',
		extraOAuthParams: Record<string, string> = {}
	): Record<string, string> {
		const timestamp = Math.floor(Date.now() / 1000).toString();
		const nonce = randomBytes(16).toString('hex');

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

		const allParams = { ...oauthParams, ...requestParams };
		const baseString = FatSecretApi.buildSignatureBaseString(method, url, allParams);

		const signingKey = `${FatSecretApi.percentEncode(consumerSecret)}&${FatSecretApi.percentEncode(accessSecret)}`;
		const signature = createHmac('sha1', signingKey).update(baseString).digest('base64');

		oauthParams.oauth_signature = signature;
		return oauthParams;
	}

	/**
	 * Sign an OAuth 1.0 HMAC-SHA1 request and return the full Authorization
	 * header value.
	 */
	private static buildOAuth1Header(
		method: string,
		url: string,
		requestParams: Record<string, string>,
		consumerKey: string,
		consumerSecret: string,
		accessToken = '',
		accessSecret = '',
		extraOAuthParams: Record<string, string> = {}
	): string {
		const oauthParams = FatSecretApi.buildOAuth1Params(
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
				.map(([key, value]) => `${key}="${FatSecretApi.percentEncode(value)}"`)
				.join(', ')
		);
	}

	/**
	 * Parse an application/x-www-form-urlencoded response body into a
	 * key/value map.
	 */
	public static parseFormEncoded(body: string): Record<string, string> {
		return Object.fromEntries(new URLSearchParams(body));
	}

	// -------------------------------------------------------------------------
	// Instance: authenticated API requests
	// -------------------------------------------------------------------------

	/**
	 * Sign and execute a GET request against the FatSecret REST API.
	 * Returns the parsed JSON response body.
	 */
	private async request(requestParams: Record<string, string>): Promise<Record<string, unknown>> {
		const fullParams = { ...requestParams, format: 'json' };
		const oauthParams = FatSecretApi.buildOAuth1Params(
			'GET',
			FATSECRET_API_URL,
			fullParams,
			this.consumerKey,
			this.consumerSecret,
			this.accessToken,
			this.accessSecret
		);

		const queryString = new URLSearchParams({ ...fullParams, ...oauthParams }).toString();
		const response = await fetch(`${FATSECRET_API_URL}?${queryString}`);

		if (!response.ok) {
			throw new Error(`FatSecret API error: ${response.status} ${response.statusText}`);
		}

		return response.json() as Promise<Record<string, unknown>>;
	}

	/**
	 * Fetch and normalise the `day` array from a monthly FatSecret endpoint.
	 * Handles the single-day case where the API returns an object instead of an array.
	 */
	private async fetchMonthDays(method: string, dateInMonth: Date): Promise<unknown[]> {
		const json = await this.request({
			method,
			date: FatSecretApi.dateToDayInt(dateInMonth).toString()
		});
		const month = json?.month as Record<string, unknown> | undefined;
		if (!month?.day) return [];
		return Array.isArray(month.day) ? month.day : [month.day];
	}

	/**
	 * Fetch all weight entries for a given month.
	 *
	 * @param dateInMonth  Any Date within the desired month
	 */
	public async getWeightMonth(dateInMonth: Date): Promise<WeightEntry[]> {
		const days = await this.fetchMonthDays('weights.get_month.v2', dateInMonth);

		return days.map((day) => {
			const { date_int, weight_kg, weight_comment } = day as {
				date_int: string;
				weight_kg: string;
				weight_comment?: string;
			};
			return {
				date_int: Number(date_int),
				date: FatSecretApi.dayIntToIso(Number(date_int)),
				weight_kg: parseFloat(weight_kg),
				weight_comment
			};
		});
	}

	/**
	 * Fetch all daily nutrition summaries for a given month.
	 * Returns per-day totals for calories, protein, carbohydrate, and fat.
	 *
	 * @param dateInMonth  Any Date within the desired month
	 */
	public async getNutritionMonth(dateInMonth: Date): Promise<NutritionEntry[]> {
		const days = await this.fetchMonthDays('food_entries.get_month.v2', dateInMonth);

		return days.map((day) => {
			const { date_int, calories, fat, carbohydrate, protein } = day as {
				date_int: string;
				calories: string;
				fat: string;
				carbohydrate: string;
				protein: string;
			};
			return {
				date_int: Number(date_int),
				date: FatSecretApi.dayIntToIso(Number(date_int)),
				calories: parseFloat(calories),
				protein_g: parseFloat(protein),
				carbohydrate_g: parseFloat(carbohydrate),
				fat_g: parseFloat(fat)
			};
		});
	}
}