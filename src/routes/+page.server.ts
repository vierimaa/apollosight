import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  try {
    const response = await fetch("http://localhost:3000/workouts");

    if (!response.ok) {
      throw error(
        response.status,
        `Failed to fetch workouts: ${response.statusText}`
      );
    }

    const workoutData = await response.json();

    if (!workoutData || workoutData.length === 0) {
      throw error(404, "No workouts found");
    }

    return { workoutData };

  } catch (err: any) {
    console.error("Error loading workouts:", err);
    throw error(500, "Internal Server Error");
  }
};
