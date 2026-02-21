import { error, isHttpError } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { API_BASE } from '$lib/api';
import type { WorkoutSession } from '$lib/types';

const calcVolume = (exercises: WorkoutSession['exercises']): number => {
	let total = 0;
	for (const exercise of exercises) {
		for (const set of exercise.sets) {
			if (set.set_type === 'normal' || set.set_type === 'failure') {
				total += set.weight_kg * set.reps;
			}
		}
	}
	return Math.round(total);
};

export const load: PageServerLoad = async ({ params }) => {
	try {
		const response = await fetch(`${API_BASE}/workouts?uuid=${params.uuid}`);
		if (!response.ok) throw error(response.status, `Failed to fetch workout: ${response.statusText}`);

		const jsonData = await response.json();
		const workout: WorkoutSession = jsonData[0];
		if (!workout) throw error(404, 'Not found');

		// Per-exercise volumes (warmup sets excluded)
		const exerciseVolumes: Record<string, number> = {};
		for (const exercise of workout.exercises) {
			exerciseVolumes[exercise.exercise_title] = calcVolume([exercise]);
		}

		// Total volume across all exercises
		const totalVolume = calcVolume(workout.exercises);

		// Find previous workout with the same title
		const titleResponse = await fetch(
			`${API_BASE}/workouts?title=${encodeURIComponent(workout.title)}`
		);
		if (!titleResponse.ok) throw error(titleResponse.status, 'Failed to fetch related workouts');

		const sameTitleWorkouts: WorkoutSession[] = await titleResponse.json();
		const currentDate = new Date(workout.start_time).getTime();

		const previousWorkout =
			sameTitleWorkouts
				.filter((session) => new Date(session.start_time).getTime() < currentDate)
				.sort((sessionA, sessionB) => new Date(sessionB.start_time).getTime() - new Date(sessionA.start_time).getTime())[0]
				?? null;

		const nextWorkout =
			sameTitleWorkouts
				.filter((session) => new Date(session.start_time).getTime() > currentDate)
				.sort((sessionA, sessionB) => new Date(sessionA.start_time).getTime() - new Date(sessionB.start_time).getTime())[0]
				?? null;

		return {
			workout,
			totalVolume,
			exerciseVolumes,
			previousWorkout: previousWorkout
				? { uuid: previousWorkout.uuid, title: previousWorkout.title, start_time: previousWorkout.start_time }
				: null,
			nextWorkout: nextWorkout
				? { uuid: nextWorkout.uuid, title: nextWorkout.title, start_time: nextWorkout.start_time }
				: null
		};
	} catch (err) {
		if (isHttpError(err)) throw err;
		console.error('Error loading workout detail:', err);
		throw error(500, 'Internal Server Error');
	}
};
