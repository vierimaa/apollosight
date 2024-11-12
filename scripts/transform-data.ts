import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';

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
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rawDataFilePath = path.join(__dirname, 'workouts.csv');

function parseDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toISOString(); // Converts to ISO 8601 format, e.g., "2024-10-01T17:02:00.000Z"
}

fs.readFile(rawDataFilePath, 'utf-8', (err, rawData) => {
  if (err) {
    console.log('Error loading data:', err);
    return; // Exit if there's an error
  }

  const parsedData = Papa.parse<WorkoutData>(rawData, {
    header: true
  });

  const data = parsedData.data

  data.map(bar => console.log(bar))

  // console.log(parsedData.data[9]);
});

// console.log("helloo")