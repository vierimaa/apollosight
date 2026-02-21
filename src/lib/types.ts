export interface WorkoutSet {
  set_index: number;
  set_type: string;
  weight_kg: number;
  reps: number;
  rpe: number | null;
}

export interface Exercise {
  exercise_title: string;
  exercise_notes: string | null;
  sets: WorkoutSet[];
}

export interface WorkoutSession {
  uuid: string;
  title: string;
  start_time: string;
  end_time: string;
  duration_seconds: number | null;
  exercises: Exercise[];
}

/** A single exercise entry enriched with the parent workout's date and UUID. */
export interface ExerciseHistoryEntry extends Exercise {
  workout_date: string;
  workout_uuid: string;
}
