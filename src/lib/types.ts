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

/** A weight entry from FatSecret's weight diary. */
export interface WeightEntry {
  /** Days elapsed since January 1, 1970 (FatSecret's date format). */
  date_int: number;
  /** ISO 8601 date string derived from date_int. */
  date: string;
  weight_kg: number;
  weight_comment?: string;
}

/** A daily nutrition summary entry from FatSecret's food diary. */
export interface NutritionEntry {
  /** Days elapsed since January 1, 1970 (FatSecret's date format). */
  date_int: number;
  /** ISO 8601 date string derived from date_int (YYYY-MM-DD). */
  date: string;
  calories: number;
  protein_g: number;
  carbohydrate_g: number;
  fat_g: number;
}
