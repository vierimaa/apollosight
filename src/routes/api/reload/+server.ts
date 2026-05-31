import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { invalidateCache } from '$lib/db';

export const POST: RequestHandler = () => {
	invalidateCache();
	return json({ ok: true });
};
