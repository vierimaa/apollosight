import { error, isHttpError, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	FATSECRET_CONSUMER_KEY,
	FATSECRET_CONSUMER_SECRET,
	FATSECRET_ACCESS_TOKEN,
	FATSECRET_ACCESS_SECRET
} from '$env/static/private';
import { FatSecretApi } from '$lib/fatsecret';
import type { CombinedDayEntry } from '$lib/types';

/** How many calendar months back to fetch (inclusive of current month). */
const MONTHS_TO_FETCH = 3;

type InsightsResult = { entries: CombinedDayEntry[] };

let insightsCache: { data: InsightsResult; expiresAt: number } | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export const load: PageServerLoad = async () => {
	if (!FATSECRET_ACCESS_TOKEN || !FATSECRET_ACCESS_SECRET) {
		throw redirect(302, '/auth/fatsecret');
	}

	if (insightsCache && Date.now() < insightsCache.expiresAt) {
		return insightsCache.data;
	}

	try {
		const today = new Date();
		const monthDates: Date[] = Array.from({ length: MONTHS_TO_FETCH }, (_, monthsBack) => {
			return new Date(today.getFullYear(), today.getMonth() - monthsBack, 15);
		});

		const api = new FatSecretApi(
			FATSECRET_CONSUMER_KEY,
			FATSECRET_CONSUMER_SECRET,
			FATSECRET_ACCESS_TOKEN,
			FATSECRET_ACCESS_SECRET
		);

		// Fetch all weight months and all nutrition months in parallel.
		const [weightResults, nutritionResults] = await Promise.all([
			Promise.all(monthDates.map((date) => api.getWeightMonth(date))),
			Promise.all(monthDates.map((date) => api.getNutritionMonth(date)))
		]);

		// Build a map keyed by date string, merging both datasets.
		const entryMap = new Map<string, CombinedDayEntry>();

		for (const monthEntries of nutritionResults) {
			for (const entry of monthEntries) {
				if (!entryMap.has(entry.date)) {
					entryMap.set(entry.date, {
						date_int: entry.date_int,
						date: entry.date,
						calories: entry.calories,
						protein_g: entry.protein_g,
						carbohydrate_g: entry.carbohydrate_g,
						fat_g: entry.fat_g
					});
				}
			}
		}

		for (const monthEntries of weightResults) {
			for (const entry of monthEntries) {
				const existing = entryMap.get(entry.date);
				if (existing) {
					existing.weight_kg = entry.weight_kg;
				} else {
					entryMap.set(entry.date, {
						date_int: entry.date_int,
						date: entry.date,
						weight_kg: entry.weight_kg
					});
				}
			}
		}

		const allEntries: CombinedDayEntry[] = [...entryMap.values()];
		allEntries.sort((entryA, entryB) => entryA.date_int - entryB.date_int);

		const result: InsightsResult = { entries: allEntries };
		insightsCache = { data: result, expiresAt: Date.now() + CACHE_TTL_MS };
		return result;
	} catch (err) {
		if (isHttpError(err)) throw err;
		console.error('FatSecret insights fetch error:', err);
		throw error(500, 'Failed to load insights data from FatSecret');
	}
};
