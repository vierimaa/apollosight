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

const writeToJson = (data: WorkoutData[]): void => {
  const json = JSON.stringify(data, null, 2);
  const outputPath = path.join(process.cwd(), "static", "workoutData.json");
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

  writeToJson(transformedData);
  console.info("Data transformation complete.");
} catch (error) {
  console.error("Error processing data:", error);
}
