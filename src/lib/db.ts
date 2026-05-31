import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { WorkoutSession } from '$lib/types';

/** Path to sessionData.json. Override via DATA_PATH env variable. */
const DATA_PATH = process.env.DATA_PATH ?? resolve(process.cwd(), 'sessionData.json');

let cache: WorkoutSession[] | null = null;

const loadData = (): WorkoutSession[] => {
	if (cache) return cache;
	const raw = readFileSync(DATA_PATH, 'utf-8');
	const parsed = JSON.parse(raw) as { workouts: WorkoutSession[] };
	cache = parsed.workouts;
	return cache;
};

/** Clears the in-memory cache so the next request re-reads the file. */
export const invalidateCache = (): void => {
	cache = null;
};

export const getWorkouts = (): WorkoutSession[] => loadData();

export const getWorkoutByUuid = (uuid: string): WorkoutSession | null =>
	loadData().find((workout) => workout.uuid === uuid) ?? null;

export const getWorkoutsByTitle = (title: string): WorkoutSession[] =>
	loadData().filter((workout) => workout.title === title);
