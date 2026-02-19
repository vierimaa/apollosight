import { error, isHttpError } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { API_BASE } from "$lib/api";

export const load: PageServerLoad = async () => {
  try {
    const response = await fetch(`${API_BASE}/workouts`);

    if (!response.ok) {
      throw error(response.status, `Failed to fetch workouts: ${response.statusText}`);
    }

    const workouts = await response.json();

    // Collect all unique exercise titles with their most recent workout date
    const exerciseLastDate = new Map<string, string>();
    for (const workout of workouts) {
      if (!workout.exercises) continue;
      for (const exercise of workout.exercises) {
        const title = exercise.exercise_title;
        const date = workout.start_time;
        if (!exerciseLastDate.has(title) || date > exerciseLastDate.get(title)!) {
          exerciseLastDate.set(title, date);
        }
      }
    }

    const exercises = Array.from(exerciseLastDate.entries())
      .map(([title, lastDate]) => ({ title, lastDate }))
      .sort((exerciseA, exerciseB) => exerciseA.title.localeCompare(exerciseB.title));

    return { exercises };
  } catch (err) {
    if (isHttpError(err)) throw err;
    console.error("Error loading exercises:", err);
    throw error(500, "Internal Server Error");
  }
};