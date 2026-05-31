import { error, isHttpError } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getWorkoutByUuid, getWorkoutsByTitle } from '$lib/db';
import { calcSessionVolume } from '$lib/utils/workout';


export const load: PageServerLoad = async ({ params }) => {
	try {
		const workout = getWorkoutByUuid(params.uuid);
		if (!workout) throw error(404, 'Not found');

		// Per-exercise volumes (warmup sets excluded)
		const exerciseVolumes: Record<string, number> = {};
		for (const exercise of workout.exercises) {
			exerciseVolumes[exercise.exercise_title] = Math.round(calcSessionVolume([exercise]));
		}

		// Total volume across all exercises
		const totalVolume = Math.round(calcSessionVolume(workout.exercises));

		// Find previous workout with the same title
		const sameTitleWorkouts = getWorkoutsByTitle(workout.title);
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
