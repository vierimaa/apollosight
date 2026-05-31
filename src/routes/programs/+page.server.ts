import { error, isHttpError } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getWorkouts } from '$lib/db';
import { slugify } from '$lib/utils/format';
import { calcSessionVolume } from '$lib/utils/workout';
import type { WorkoutSession } from '$lib';

export interface ProgramSummary {
	title: string;
	slug: string;
	sessionCount: number;
	lastDate: string;
	totalVolume: number;
	avgDuration: number | null;
}

export const load: PageServerLoad = async () => {
	try {
		const workouts: WorkoutSession[] = getWorkouts();

		// Group sessions by workout title
		const programMap = new Map<
			string,
			{
				sessionCount: number;
				lastDate: string;
				totalVolume: number;
				totalDuration: number;
				durationCount: number;
			}
		>();

		for (const workout of workouts) {
			const title = workout.title;
			const date = workout.start_time;

			const sessionVolume = calcSessionVolume(workout.exercises ?? []);

			if (!programMap.has(title)) {
				programMap.set(title, {
					sessionCount: 0,
					lastDate: date,
					totalVolume: 0,
					totalDuration: 0,
					durationCount: 0
				});
			}

			const entry = programMap.get(title)!;
			entry.sessionCount += 1;
			entry.totalVolume += sessionVolume;
			if (date > entry.lastDate) entry.lastDate = date;
			if (workout.duration_seconds != null) {
				entry.totalDuration += workout.duration_seconds;
				entry.durationCount += 1;
			}
		}

		const programs: ProgramSummary[] = Array.from(programMap.entries())
			.map(([title, stats]) => ({
				title,
				slug: slugify(title),
				sessionCount: stats.sessionCount,
				lastDate: stats.lastDate,
				totalVolume: stats.totalVolume,
				avgDuration:
					stats.durationCount > 0
						? Math.round(stats.totalDuration / stats.durationCount)
						: null
			}))
			.sort(
				(programA, programB) =>
					new Date(programB.lastDate).getTime() - new Date(programA.lastDate).getTime()
			);

		return { programs };
	} catch (err) {
		if (isHttpError(err)) throw err;
		console.error('Error loading programs:', err);
		throw error(500, 'Internal Server Error');
	}
};
