import fs from "fs";
import path from "path";
import Papa from "papaparse";
import crypto from 'crypto';

interface WorkoutData {
  title: string;
  start_time: string;
  end_time: string;
  description: string | null;
  exercise_title: string;
  superset_id: string | null;
  exercise_notes: string | null;
  set_index: number;
  set_type: string;
  weight_kg: number | null;
  reps: number | null;
  distance_km: number | null;
  duration_seconds: number | null;
  rpe: number | null;
  uuid: string;
}

interface Set {
  set_index: number;
  set_type: string;
  weight_kg: number;
  reps: number;
  rpe: number | null;
}

interface Exercise {
  exercise_title: string;
  exercise_notes: string | null;
  sets: Set[];
}

interface WorkoutSession {
  title: string;
  start_time: string;
  end_time: string;
  duration_seconds: number | null;
  uuid: string;
  exercises: Exercise[];
}

const parseDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toISOString(); // Converts to ISO 8601 format, e.g., "2024-10-01T17:02:00.000Z"
};

const addDuration = (workout: WorkoutData): WorkoutData => {
  const startTime = new Date(workout.start_time);
  const endTime = new Date(workout.end_time);
  const duration = endTime.getTime() - startTime.getTime();
  return {
    ...workout,
    duration_seconds: duration / 1000,
  };
};

const addUuid = (workout: WorkoutData): WorkoutData => {
  const hash = crypto.createHash('sha256');
  hash.update(workout.start_time);
  const uuid = hash.digest('hex');
  return {
    ...workout,
    uuid
  };
};

function groupWorkoutsBySession(workouts: WorkoutData[]): WorkoutSession[] {
  const sessionMap = new Map<string, WorkoutSession>();

  for (const workout of workouts) {
    if (!sessionMap.has(workout.uuid)) {
      sessionMap.set(workout.uuid, {
        title: workout.title,
        start_time: workout.start_time,
        end_time: workout.end_time,
        uuid: workout.uuid,
        duration_seconds: workout.duration_seconds,
        exercises: [],
      });
    }

    const session = sessionMap.get(workout.uuid)!;

    let exercise = session.exercises.find(
      (ex) => ex.exercise_title === workout.exercise_title
    );

    if (!exercise) {
      exercise = {
        exercise_title: workout.exercise_title,
        exercise_notes: workout.exercise_notes,
        sets: [],
      };
      session.exercises.push(exercise);
    }

    exercise.sets.push({
      set_index: workout.set_index,
      set_type: workout.set_type,
      weight_kg: Number(workout.weight_kg),
      reps: Number(workout.reps),
      rpe: workout.rpe ? Number(workout.rpe) : null,
    });
  }

  return Array.from(sessionMap.values());
}

const writeToJson = (data: unknown, fileName: string): void => {
  const json = JSON.stringify(data, null, 2);
  const outputPath = path.join(process.cwd(), fileName);
  fs.writeFileSync(outputPath, json);
};

try {
  const filePath = path.join(import.meta.dirname, "workouts.csv");
  const rawData = fs.readFileSync(filePath, "utf-8");

  const parsedData = Papa.parse<WorkoutData>(rawData, {
    header: true,
  }).data;

  const transformedData = parsedData.map((workout) => {
    const withTransformedDate = {
      ...workout,
      start_time: parseDate(workout.start_time),
      end_time: parseDate(workout.end_time),
    };
    const withDuration = addDuration(withTransformedDate);
    return addUuid(withDuration);
  });

  const groupedData = groupWorkoutsBySession(transformedData);

  console.info("Transforming data...");
  writeToJson({ workouts: groupedData }, "sessionData.json");
  console.info("Data transformation complete.");
} catch (error) {
  console.error("Error processing data:", error);
}
