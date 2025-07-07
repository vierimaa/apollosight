import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  const exerciseName = params.exercise; // e.g. "Chest Press (Machine)"
  const response = await fetch("http://localhost:3000/workouts");
  const workouts = await response.json();

  // Find all sets for this exercise across all workouts
  let exerciseHistory = [];
  for (const workout of workouts) {
    if (!workout.exercises) continue;
    for (const exercise of workout.exercises) {
      if (exercise.exercise_title.replace(/\s+/g, '-').toLowerCase() === exerciseName) {
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

  return { exerciseName, exerciseHistory };
};