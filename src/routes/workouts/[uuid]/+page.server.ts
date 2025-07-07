import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  const response = await fetch(
    `http://localhost:3000/workouts?uuid=${params.uuid}`
  );
  const jsonData = await response.json();

  const workout = jsonData[0];

  if (workout) {
    return { workout };
  }

  throw error(404, "Not found");
};
