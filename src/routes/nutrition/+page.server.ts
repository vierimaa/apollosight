import { error, isHttpError, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	FATSECRET_CONSUMER_KEY,
	FATSECRET_CONSUMER_SECRET,
	FATSECRET_ACCESS_TOKEN,
	FATSECRET_ACCESS_SECRET
} from '$env/static/private';
import { FatSecretApi } from '$lib/fatsecret';
import type { NutritionEntry } from '$lib/types';

/** How many calendar months back to fetch (inclusive of current month). */
const MONTHS_TO_FETCH = 7;

type NutritionResult = {
	entries: NutritionEntry[];
	totalDays: number;
	avgCalories: number;
	avgProtein: number;
	avgCarbs: number;
	avgFat: number;
};

let nutritionCache: { data: NutritionResult; expiresAt: number } | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export const load: PageServerLoad = async () => {
	if (!FATSECRET_ACCESS_TOKEN || !FATSECRET_ACCESS_SECRET) {
		throw redirect(302, '/auth/fatsecret');
	}

	if (nutritionCache && Date.now() < nutritionCache.expiresAt) {
		return nutritionCache.data;
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

		const monthResults = await Promise.all(
			monthDates.map((date) => api.getNutritionMonth(date))
		);

		// Flatten, deduplicate by date_int, and sort oldest → newest.
		const seenDateInts = new Set<number>();
		const allEntries: NutritionEntry[] = [];

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
			const emptyResult: NutritionResult = {
				entries: [] as NutritionEntry[],
				totalDays: 0,
				avgCalories: 0,
				avgProtein: 0,
				avgCarbs: 0,
				avgFat: 0
			};
			nutritionCache = { data: emptyResult, expiresAt: Date.now() + CACHE_TTL_MS };
			return emptyResult;
		}

		const totalDays = allEntries.length;
		const avgCalories = Math.round(allEntries.reduce((sum, e) => sum + e.calories, 0) / totalDays);
		const avgProtein = Math.round(allEntries.reduce((sum, e) => sum + e.protein_g, 0) / totalDays);
		const avgCarbs = Math.round(allEntries.reduce((sum, e) => sum + e.carbohydrate_g, 0) / totalDays);
		const avgFat = Math.round(allEntries.reduce((sum, e) => sum + e.fat_g, 0) / totalDays);

		const result: NutritionResult = { entries: allEntries, totalDays, avgCalories, avgProtein, avgCarbs, avgFat };
		nutritionCache = { data: result, expiresAt: Date.now() + CACHE_TTL_MS };
		return result;
	} catch (err) {
		if (isHttpError(err)) throw err;
		console.error('FatSecret nutrition fetch error:', err);
		throw error(500, 'Failed to load nutrition data from FatSecret');
	}
};
