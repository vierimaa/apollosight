import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { API_BASE } from "$lib/api";

export const load: PageServerLoad = async ({ params }) => {
  const response = await fetch(`${API_BASE}/workouts?uuid=${params.uuid}`);

  if (!response.ok) {
    throw error(response.status, `Failed to fetch workout: ${response.statusText}`);
  }

  const jsonData = await response.json();
  const workout = jsonData[0];

  if (!workout) {
    throw error(404, "Not found");
  }

  return { workout };
};
