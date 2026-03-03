import { error, isHttpError } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { API_BASE } from '$lib/api';
import { slugify } from '$lib/utils/format';
import type { WorkoutSession } from '$lib';

export const load: PageServerLoad = async ({ params }) => {
	try {
		const programSlug = params.program;
		const response = await fetch(`${API_BASE}/workouts`);

		if (!response.ok) {
			throw error(response.status, `Failed to fetch workouts: ${response.statusText}`);
		}

		const workouts: WorkoutSession[] = await response.json();

		let programTitle = '';
		const matchedSessions = [];

		for (const workout of workouts) {
			if (slugify(workout.title) !== programSlug) continue;

			if (!programTitle) programTitle = workout.title;

			let sessionVolume = 0;
			let sessionSets = 0;
			let sessionReps = 0;

			for (const exercise of workout.exercises ?? []) {
				for (const set of exercise.sets ?? []) {
					sessionVolume += set.weight_kg * set.reps;
					sessionSets += 1;
					sessionReps += set.reps;
				}
			}

			matchedSessions.push({
				uuid: workout.uuid,
				start_time: workout.start_time,
				duration_seconds: workout.duration_seconds,
				totalVolume: sessionVolume,
				totalSets: sessionSets,
				totalReps: sessionReps
			});
		}

		if (matchedSessions.length === 0) {
			throw error(404, 'Program not found');
		}

		// Sort ascending by date so charts show progression left to right
		matchedSessions.sort(
			(sessionA, sessionB) =>
				new Date(sessionA.start_time).getTime() - new Date(sessionB.start_time).getTime()
		);

		const totalSessions = matchedSessions.length;
		const allTimeVolume = matchedSessions.reduce(
			(total, session) => total + session.totalVolume,
			0
		);
		const avgVolume = Math.round(allTimeVolume / totalSessions);

		const duringSessions = matchedSessions.filter((session) => session.duration_seconds != null);
		const avgDuration =
			duringSessions.length > 0
				? Math.round(
						duringSessions.reduce(
							(total, session) => total + (session.duration_seconds ?? 0),
							0
						) / duringSessions.length
					)
				: null;

		const chartLabels = matchedSessions.map((session) =>
			new Date(session.start_time).toLocaleDateString('fi-FI')
		);
		const volumeData = matchedSessions.map((session) => session.totalVolume);
		const durationData = matchedSessions.map((session) =>
			session.duration_seconds != null ? Math.round(session.duration_seconds / 60) : null
		);
		const setsData = matchedSessions.map((session) => session.totalSets);
		const repsData = matchedSessions.map((session) => session.totalReps);

		return {
			programTitle,
			totalSessions,
			allTimeVolume,
			avgVolume,
			avgDuration,
			chartLabels,
			volumeData,
			durationData,
			setsData,
			repsData,
			sessions: matchedSessions
		};
	} catch (err) {
		if (isHttpError(err)) throw err;
		console.error('Error loading program detail:', err);
		throw error(500, 'Internal Server Error');
	}
};
