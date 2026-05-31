import { error, isHttpError } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { getWorkouts } from '$lib/db';

export const load: PageServerLoad = async () => {
  try {
    const workouts = getWorkouts();

    // Collect all unique exercise titles with their most recent workout date
    const exerciseLastDate = new Map<string, string>();
    const exerciseSessionCount = new Map<string, number>();
    for (const workout of workouts) {
      if (!workout.exercises) continue;
      for (const exercise of workout.exercises) {
        const title = exercise.exercise_title;
        const date = workout.start_time;
        if (!exerciseLastDate.has(title) || date > exerciseLastDate.get(title)!) {
          exerciseLastDate.set(title, date);
        }
        exerciseSessionCount.set(title, (exerciseSessionCount.get(title) ?? 0) + 1);
      }
    }

    const exercises = Array.from(exerciseLastDate.entries())
      .map(([title, lastDate]) => ({ title, lastDate, sessionCount: exerciseSessionCount.get(title) ?? 0 }))
      .sort((exerciseA, exerciseB) => exerciseA.title.localeCompare(exerciseB.title));

    return { exercises };
  } catch (err) {
    if (isHttpError(err)) throw err;
    console.error("Error loading exercises:", err);
    throw error(500, "Internal Server Error");
  }
};