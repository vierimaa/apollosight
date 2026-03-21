import { error, isHttpError } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { API_BASE } from "$lib/api";
import { slugify } from "$lib/utils/format";
import { estimateOneRM, calcSessionVolume, sortExerciseHistoryByDate } from "$lib/utils/workout";

export const load: PageServerLoad = async ({ params }) => {
  try {
    const exerciseSlug = params.exercise;
    const response = await fetch(`${API_BASE}/workouts`);

    if (!response.ok) {
      throw error(response.status, `Failed to fetch workouts: ${response.statusText}`);
    }

    const workouts = await response.json();

    // Find all sessions for this exercise across all workouts
    let exerciseTitle = '';
    const exerciseHistory = [];
    for (const workout of workouts) {
      if (!workout.exercises) continue;
      for (const exercise of workout.exercises) {
        if (slugify(exercise.exercise_title) === exerciseSlug) {
          if (!exerciseTitle) exerciseTitle = exercise.exercise_title;
          exerciseHistory.push({
            workout_date: workout.start_time,
            workout_uuid: workout.uuid,
            ...exercise
          });
        }
      }
    }

    if (exerciseHistory.length === 0) {
      throw error(404, "Exercise not found");
    }

    // Pre-sort ascending by date so the client can filter without re-sorting
    const sortedHistory = sortExerciseHistoryByDate(exerciseHistory, 'asc');

    const totalSessions = sortedHistory.length;

    const bestWeight = sortedHistory.reduce((best, entry) => {
      const maxInSession = Math.max(...entry.sets.map((set) => set.weight_kg));
      return Math.max(best, maxInSession);
    }, 0);

    const bestOneRM = sortedHistory.reduce((best, entry) => {
      const maxInSession = Math.max(
        ...entry.sets.map((set) => estimateOneRM(set.weight_kg, set.reps))
      );
      return Math.max(best, maxInSession);
    }, 0);

    const allTimeVolume = calcSessionVolume(sortedHistory);

    return { exerciseTitle, exerciseHistory: sortedHistory, totalSessions, bestWeight, bestOneRM, allTimeVolume };
  } catch (err) {
    if (isHttpError(err)) throw err;
    console.error("Error loading exercise detail:", err);
    throw error(500, "Internal Server Error");
  }
};