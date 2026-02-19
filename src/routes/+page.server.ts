import { error, isHttpError } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { API_BASE } from "$lib/api";

export const load: PageServerLoad = async () => {
  try {
    const response = await fetch(`${API_BASE}/workouts`);

    if (!response.ok) {
      throw error(response.status, `Failed to fetch workouts: ${response.statusText}`);
    }

    const workoutData = await response.json();

    if (!workoutData || workoutData.length === 0) {
      throw error(404, "No workouts found");
    }

    return { workoutData };
  } catch (err) {
    if (isHttpError(err)) throw err;
    console.error("Error loading workouts:", err);
    throw error(500, "Internal Server Error");
  }
};
