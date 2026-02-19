import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { API_BASE } from "$lib/api";

export const load: PageServerLoad = async ({ params }) => {
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
      if (exercise.exercise_title.replace(/\s+/g, "-").toLowerCase() === exerciseSlug) {
        if (!exerciseTitle) exerciseTitle = exercise.exercise_title;
        exerciseHistory.push({
          workout_date: workout.start_time,
          ...exercise
        });
      }
    }
  }

  if (exerciseHistory.length === 0) {
    throw error(404, "Exercise not found");
  }

  return { exerciseTitle, exerciseHistory };
};