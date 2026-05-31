import { error, isHttpError } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getWorkouts } from '$lib/db';
import { slugify } from '$lib/utils/format';
import { VALID_SET_TYPES, estimateOneRM, sortWorkoutsByDate } from '$lib/utils/workout';
import type { WorkoutSession } from '$lib/types';

interface SetPR {
	value: number;
	date: string;
}

interface ExercisePR {
	title: string;
	slug: string;
	bestOneRM: SetPR;
	heaviestWeight: SetPR;
	mostReps: SetPR;
	bestVolume: SetPR;
	totalSessions: number;
	lastSeenDate: string;
}


export const load: PageServerLoad = async () => {
	try {
		const workouts: WorkoutSession[] = getWorkouts();

		// Sort oldest → newest so we can track progression chronologically
		const sortedWorkouts = sortWorkoutsByDate(workouts, 'asc');

		const prMap = new Map<
			string,
			{
				bestOneRM: SetPR;
				heaviestWeight: SetPR;
				mostReps: SetPR;
				bestVolume: SetPR;
				sessions: Set<string>;
				lastSeenDate: string;
			}
		>();

		for (const workout of sortedWorkouts) {
			if (!workout.exercises) continue;
			const workoutDate = workout.start_time;

			for (const exercise of workout.exercises) {
				const title = exercise.exercise_title;

				if (!prMap.has(title)) {
					prMap.set(title, {
						bestOneRM: { value: 0, date: workoutDate },
						heaviestWeight: { value: 0, date: workoutDate },
						mostReps: { value: 0, date: workoutDate },
						bestVolume: { value: 0, date: workoutDate },
						sessions: new Set(),
						lastSeenDate: workoutDate
					});
				}

				const record = prMap.get(title)!;
				record.sessions.add(workout.uuid);

				if (workoutDate > record.lastSeenDate) {
					record.lastSeenDate = workoutDate;
				}

				// Accumulate session volume for this exercise in this workout
				let sessionVolume = 0;

				for (const set of exercise.sets) {
					if (!VALID_SET_TYPES.has(set.set_type)) continue;
					if (set.weight_kg === 0 || set.reps === 0) continue;

					const oneRM = estimateOneRM(set.weight_kg, set.reps);

					if (oneRM > record.bestOneRM.value) {
						record.bestOneRM = { value: oneRM, date: workoutDate };
					}
					if (set.weight_kg > record.heaviestWeight.value) {
						record.heaviestWeight = { value: set.weight_kg, date: workoutDate };
					}
					if (set.reps > record.mostReps.value) {
						record.mostReps = { value: set.reps, date: workoutDate };
					}

					sessionVolume += set.weight_kg * set.reps;
				}

				if (sessionVolume > record.bestVolume.value) {
					record.bestVolume = { value: sessionVolume, date: workoutDate };
				}
			}
		}

		const exercisePRs: ExercisePR[] = Array.from(prMap.entries())
			.map(([title, record]) => ({
				title,
				slug: slugify(title),
				bestOneRM: { value: Math.round(record.bestOneRM.value * 10) / 10, date: record.bestOneRM.date },
				heaviestWeight: record.heaviestWeight,
				mostReps: record.mostReps,
				bestVolume: { value: Math.round(record.bestVolume.value * 10) / 10, date: record.bestVolume.date },
				totalSessions: record.sessions.size,
				lastSeenDate: record.lastSeenDate
			}))
			// Sort by most recently performed first
			.sort(
				(exerciseA, exerciseB) =>
					new Date(exerciseB.lastSeenDate).getTime() - new Date(exerciseA.lastSeenDate).getTime()
			);

		return { exercisePRs, totalExercises: exercisePRs.length };
	} catch (err) {
		if (isHttpError(err)) throw err;
		console.error('Error loading stats:', err);
		throw error(500, 'Internal Server Error');
	}
};
