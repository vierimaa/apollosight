import { error, isHttpError } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { API_BASE } from "$lib/api";
import type { WorkoutSession } from "$lib";

interface MonthAccumulator {
  volumeTotal: number;
  durationTotal: number;
  count: number;
}

interface MonthlyChartData {
  labels: string[];
  volumeData: number[];
  avgDurationData: (number | null)[];
}

interface CalendarDay {
  date: string;
  count: number;
}

interface CalendarMonthLabel {
  name: string;
  weekIndex: number;
}

export interface WorkoutSummary {
  uuid: string;
  title: string;
  start_time: string;
  duration_seconds: number | null;
  exerciseCount: number;
  volume: number;
  totalSets: number;
}

const calcVolume = (workout: WorkoutSession): number => {
  let total = 0;
  for (const exercise of workout.exercises) {
    for (const set of exercise.sets) {
      if (set.set_type === 'normal' || set.set_type === 'failure') {
        total += set.weight_kg * set.reps;
      }
    }
  }
  return total;
};

const calcTotalSets = (workout: WorkoutSession): number => {
  let total = 0;
  for (const exercise of workout.exercises) {
    total += exercise.sets.length;
  }
  return total;
};

const buildWorkoutSummaries = (workouts: WorkoutSession[]): WorkoutSummary[] =>
  [...workouts]
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
    .map((workout) => ({
      uuid: workout.uuid,
      title: workout.title,
      start_time: workout.start_time,
      duration_seconds: workout.duration_seconds,
      exerciseCount: workout.exercises.length,
      volume: Math.round(calcVolume(workout)),
      totalSets: calcTotalSets(workout)
    }));

const computeMonthlyChartData = (workouts: WorkoutSession[]): MonthlyChartData => {
  const today = new Date();

  // Build 12 month slots (oldest → newest)
  const slots: { year: number; month: number }[] = [];
  for (let monthOffset = 11; monthOffset >= 0; monthOffset--) {
    const slotDate = new Date(today.getFullYear(), today.getMonth() - monthOffset, 1);
    slots.push({ year: slotDate.getFullYear(), month: slotDate.getMonth() });
  }

  // Single pass: accumulate volume + duration per year-month key
  const monthMap = new Map<string, MonthAccumulator>();
  for (const workout of workouts) {
    const workoutDate = new Date(workout.start_time);
    const key = `${workoutDate.getFullYear()}-${workoutDate.getMonth()}`;
    const existing = monthMap.get(key) ?? { volumeTotal: 0, durationTotal: 0, count: 0 };
    monthMap.set(key, {
      volumeTotal: existing.volumeTotal + calcVolume(workout),
      durationTotal: existing.durationTotal + (workout.duration_seconds ?? 0),
      count: existing.count + 1
    });
  }

  const labels = slots.map(({ year, month }) =>
    new Date(year, month, 1).toLocaleString('fi-FI', { month: 'short' })
  );

  const volumeData = slots.map(({ year, month }) => {
    const acc = monthMap.get(`${year}-${month}`);
    return acc ? Math.round(acc.volumeTotal) : 0;
  });

  const avgDurationData: (number | null)[] = slots.map(({ year, month }) => {
    const acc = monthMap.get(`${year}-${month}`);
    if (!acc) return null;
    return Math.round(acc.durationTotal / acc.count / 60);
  });

  return { labels, volumeData, avgDurationData };
};

const computeCalendarData = (
  workouts: WorkoutSession[]
): { calendarDays: CalendarDay[]; calendarMonthLabels: CalendarMonthLabel[] } => {
  const today = new Date();
  const days: CalendarDay[] = [];

  const workoutCounts = new Map<string, number>();
  for (const workout of workouts) {
    const dateStr = new Date(workout.start_time).toISOString().split('T')[0];
    workoutCounts.set(dateStr, (workoutCounts.get(dateStr) ?? 0) + 1);
  }

  for (let dayOffset = 0; dayOffset < 371; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() - dayOffset);
    const dateStr = date.toISOString().split('T')[0];
    days.push({ date: dateStr, count: workoutCounts.get(dateStr) ?? 0 });
  }

  // Pad beginning to align the grid with Monday
  const firstDay = new Date(days[days.length - 1].date);
  let dayOfWeek = firstDay.getDay() - 1;
  if (dayOfWeek === -1) dayOfWeek = 6;
  for (let paddingIndex = 0; paddingIndex < dayOfWeek; paddingIndex++) {
    const paddingDate = new Date(firstDay);
    paddingDate.setDate(paddingDate.getDate() - (paddingIndex + 1));
    days.push({ date: paddingDate.toISOString().split('T')[0], count: 0 });
  }

  const calendarDays = days.reverse();

  // Compute month label positions from the ordered day array
  const calendarMonthLabels: CalendarMonthLabel[] = [];
  let lastMonth = -1;
  let lastWeekIndex = -1;
  for (let dayIndex = 0; dayIndex < calendarDays.length; dayIndex++) {
    const date = new Date(calendarDays[dayIndex].date);
    const month = date.getMonth();
    const weekIndex = Math.floor(dayIndex / 7);
    if (month !== lastMonth && weekIndex !== lastWeekIndex) {
      lastMonth = month;
      lastWeekIndex = weekIndex;
      calendarMonthLabels.push({
        name: date.toLocaleString('default', { month: 'short' }),
        weekIndex
      });
    } else if (month !== lastMonth) {
      // New month started in same week as previous label — just update tracking
      lastMonth = month;
    }
  }

  return { calendarDays, calendarMonthLabels };
};

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

    return {
      workouts: buildWorkoutSummaries(workoutData),
      monthlyChartData: computeMonthlyChartData(workoutData),
      ...computeCalendarData(workoutData)
    };
  } catch (err) {
    if (isHttpError(err)) throw err;
    console.error("Error loading workouts:", err);
    throw error(500, "Internal Server Error");
  }
};
