import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  const response = await fetch("http://localhost:3000/workouts");
  const workouts = await response.json();

  // Collect all unique exercise titles
  const exerciseSet = new Set<string>();
  for (const workout of workouts) {
    if (!workout.exercises) continue;
    for (const exercise of workout.exercises) {
      exerciseSet.add(exercise.exercise_title);
    }
  }

  return { exercises: Array.from(exerciseSet) };
};