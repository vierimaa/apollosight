import type { Exercise, WorkoutSession, ExerciseHistoryEntry } from '$lib/types';

/** Set types that count toward working volume (excludes warmup, drop sets, etc.). */
export const VALID_SET_TYPES = new Set(['normal', 'failure']);

/**
 * Sums `weight_kg * reps` across all sets in the given exercises.
 * By default, only counts sets whose type is in VALID_SET_TYPES.
 */
export const calcSessionVolume = (exercises: Exercise[], filterSets = true): number => {
	let total = 0;
	for (const exercise of exercises) {
		for (const set of exercise.sets) {
			if (filterSets && !VALID_SET_TYPES.has(set.set_type)) continue;
			total += set.weight_kg * set.reps;
		}
	}
	return total;
};

/** Estimates one-rep max using the Epley formula: weight × (1 + 0.0333 × reps). */
export const estimateOneRM = (weight_kg: number, reps: number): number =>
	weight_kg * (1 + 0.0333 * reps);

/** Returns a new array of WorkoutSessions sorted by start_time. */
export const sortWorkoutsByDate = (
	workouts: WorkoutSession[],
	dir: 'asc' | 'desc'
): WorkoutSession[] =>
	[...workouts].sort((workoutA, workoutB) => {
		const diff =
			new Date(workoutA.start_time).getTime() - new Date(workoutB.start_time).getTime();
		return dir === 'asc' ? diff : -diff;
	});

/** Returns a new array of ExerciseHistoryEntries sorted by workout_date. */
export const sortExerciseHistoryByDate = (
	entries: ExerciseHistoryEntry[],
	dir: 'asc' | 'desc'
): ExerciseHistoryEntry[] =>
	[...entries].sort((entryA, entryB) => {
		const diff =
			new Date(entryA.workout_date).getTime() - new Date(entryB.workout_date).getTime();
		return dir === 'asc' ? diff : -diff;
	});

/** Extracts the YYYY-MM-DD date portion from an ISO 8601 string. */
export const toDateString = (isoStr: string): string =>
	new Date(isoStr).toISOString().split('T')[0];

/** Converts a duration in seconds to whole minutes (rounded). */
export const secondsToMinutes = (seconds: number): number => Math.round(seconds / 60);
