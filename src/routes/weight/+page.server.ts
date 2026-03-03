import { error, isHttpError, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	FATSECRET_CONSUMER_KEY,
	FATSECRET_CONSUMER_SECRET,
	FATSECRET_ACCESS_TOKEN,
	FATSECRET_ACCESS_SECRET
} from '$env/static/private';
import { fetchWeightMonth } from '$lib/fatsecret';
import type { WeightEntry } from '$lib/types';

/** How many calendar months back to fetch (inclusive of current month). */
const MONTHS_TO_FETCH = 13;

export const load: PageServerLoad = async () => {
	// If the access token hasn't been set up yet, guide the user through OAuth flow.
	if (!FATSECRET_ACCESS_TOKEN || !FATSECRET_ACCESS_SECRET) {
		throw redirect(302, '/auth/fatsecret');
	}

	try {
		// Build a Date pointing somewhere within each of the last MONTHS_TO_FETCH months.
		const today = new Date();
		const monthDates: Date[] = Array.from({ length: MONTHS_TO_FETCH }, (_, monthsBack) => {
			const date = new Date(today.getFullYear(), today.getMonth() - monthsBack, 15);
			return date;
		});

		// Fetch each month in parallel.
		const monthResults = await Promise.all(
			monthDates.map((date) =>
				fetchWeightMonth(
					date,
					FATSECRET_CONSUMER_KEY,
					FATSECRET_CONSUMER_SECRET,
					FATSECRET_ACCESS_TOKEN,
					FATSECRET_ACCESS_SECRET
				)
			)
		);

		// Flatten, deduplicate by date_int, and sort oldest → newest.
		const seenDateInts = new Set<number>();
		const allEntries: WeightEntry[] = [];

		for (const monthEntries of monthResults) {
			for (const entry of monthEntries) {
				if (!seenDateInts.has(entry.date_int)) {
					seenDateInts.add(entry.date_int);
					allEntries.push(entry);
				}
			}
		}

		allEntries.sort((entryA, entryB) => entryA.date_int - entryB.date_int);

		if (allEntries.length === 0) {
			return { entries: [] as WeightEntry[] };
		}

		return { entries: allEntries };
	} catch (err) {
		if (isHttpError(err)) throw err;
		console.error('FatSecret weight fetch error:', err);
		throw error(500, 'Failed to load weight data from FatSecret');
	}
};
