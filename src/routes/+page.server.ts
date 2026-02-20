import { error, isHttpError } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { API_BASE } from "$lib/api";
import { formatDate, formatDuration } from "$lib/utils/format";
import type { WorkoutSession } from "$lib/types";

// ─── Time helpers ──────────────────────────────────────────────────────────────

const getWeekStart = (date: Date): Date => {
  const weekStart = new Date(date);
  const day = weekStart.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  weekStart.setDate(weekStart.getDate() + diff);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
};

// ─── Trend builder ─────────────────────────────────────────────────────────────

interface Trend {
  value: number;
  direction: "up" | "down";
  label: string;
}

const buildTrend = (
  current: number,
  previous: number,
  labelFn: (delta: number) => string
): Trend | undefined => {
  if (previous === 0) return undefined;
  const delta = current - previous;
  const pct = Math.round(Math.abs((delta / previous) * 100));
  const direction: "up" | "down" = delta >= 0 ? "up" : "down";
  return { value: pct, direction, label: labelFn(delta) };
};

// ─── Streak ────────────────────────────────────────────────────────────────────

const computeStreak = (workouts: WorkoutSession[]): number => {
  const workoutWeekKeys = new Set(
    workouts.map((workout) =>
      getWeekStart(new Date(workout.start_time)).toISOString().slice(0, 10)
    )
  );
  const checkDate = getWeekStart(new Date());
  let streak = 0;
  while (true) {
    const key = checkDate.toISOString().slice(0, 10);
    if (workoutWeekKeys.has(key)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 7);
    } else {
      break;
    }
  }
  return streak;
};

// ─── All-time volume ───────────────────────────────────────────────────────────

const computeAllTimeVolume = (workouts: WorkoutSession[]): number => {
  let total = 0;
  for (const workout of workouts) {
    for (const exercise of workout.exercises) {
      for (const set of exercise.sets) {
        if (set.set_type === "normal" || set.set_type === "failure") {
          total += set.weight_kg * set.reps;
        }
      }
    }
  }
  return total;
};

// ─── Weekly frequency (last 12 weeks) ─────────────────────────────────────────

const computeWeeklyFrequency = (workouts: WorkoutSession[]): { labels: string[]; counts: number[] } => {
  const currentWeekStart = getWeekStart(new Date());
  const weekStarts: Date[] = [];

  for (let weekIndex = 11; weekIndex >= 0; weekIndex--) {
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(weekStart.getDate() - weekIndex * 7);
    weekStarts.push(weekStart);
  }

  const labels = weekStarts.map((start) => `${start.getDate()}.${start.getMonth() + 1}.`);

  const counts = weekStarts.map((start) => {
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return workouts.filter((workout) => {
      const date = new Date(workout.start_time);
      return date >= start && date < end;
    }).length;
  });

  return { labels, counts };
};

// ─── Recent PRs ────────────────────────────────────────────────────────────────

interface PrEvent {
  dateFormatted: string;
  exerciseTitle: string;
  prType: "1RM" | "Weight";
  value: number;
}

const computeRecentPrs = (workouts: WorkoutSession[], count: number): PrEvent[] => {
  const sorted = [...workouts].sort(
    (workoutA, workoutB) =>
      new Date(workoutA.start_time).getTime() - new Date(workoutB.start_time).getTime()
  );

  const bestOneRM = new Map<string, number>();
  const bestWeight = new Map<string, number>();
  const prEvents: Array<PrEvent & { timestamp: number }> = [];

  for (const workout of sorted) {
    for (const exercise of workout.exercises) {
      const exerciseTitle = exercise.exercise_title;
      const validSets = exercise.sets.filter(
        (set) => set.set_type === "normal" || set.set_type === "failure"
      );
      if (validSets.length === 0) continue;

      let sessionMaxOneRM = 0;
      let sessionMaxWeight = 0;

      for (const set of validSets) {
        if (set.reps > 0 && set.weight_kg > 0) {
          const estimatedOneRM = set.weight_kg * (1 + 0.0333 * set.reps);
          if (estimatedOneRM > sessionMaxOneRM) sessionMaxOneRM = estimatedOneRM;
          if (set.weight_kg > sessionMaxWeight) sessionMaxWeight = set.weight_kg;
        }
      }

      const prevBestOneRM = bestOneRM.get(exerciseTitle) ?? 0;
      const prevBestWeight = bestWeight.get(exerciseTitle) ?? 0;
      const timestamp = new Date(workout.start_time).getTime();

      if (sessionMaxOneRM > 0 && prevBestOneRM > 0 && sessionMaxOneRM > prevBestOneRM) {
        prEvents.push({
          timestamp,
          dateFormatted: formatDate(workout.start_time),
          exerciseTitle,
          prType: "1RM",
          value: Math.round(sessionMaxOneRM * 10) / 10,
        });
      }
      if (sessionMaxWeight > 0 && prevBestWeight > 0 && sessionMaxWeight > prevBestWeight) {
        prEvents.push({
          timestamp,
          dateFormatted: formatDate(workout.start_time),
          exerciseTitle,
          prType: "Weight",
          value: sessionMaxWeight,
        });
      }

      if (sessionMaxOneRM > prevBestOneRM) bestOneRM.set(exerciseTitle, sessionMaxOneRM);
      if (sessionMaxWeight > prevBestWeight) bestWeight.set(exerciseTitle, sessionMaxWeight);
    }
  }

  return prEvents
    .sort((eventA, eventB) => eventB.timestamp - eventA.timestamp)
    .slice(0, count)
    .map(({ timestamp: _ts, ...rest }) => rest);
};

// ─── Load ──────────────────────────────────────────────────────────────────────

export const load: PageServerLoad = async () => {
  try {
    const response = await fetch(`${API_BASE}/workouts`);

    if (!response.ok) {
      throw error(response.status, `Failed to fetch workouts: ${response.statusText}`);
    }

    const workoutData: WorkoutSession[] = await response.json();

    if (!workoutData || workoutData.length === 0) {
      throw error(404, "No workouts found");
    }

    // ─── Time windows ──────────────────────────────────────────────────────────
    const now = new Date();
    const currentPeriodStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const prevPeriodStart = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

    // ─── Period filtering ──────────────────────────────────────────────────────
    const currentPeriodWorkouts = workoutData.filter(
      (workout) => new Date(workout.start_time) >= currentPeriodStart
    );
    const prevPeriodWorkouts = workoutData.filter((workout) => {
      const date = new Date(workout.start_time);
      return date >= prevPeriodStart && date < currentPeriodStart;
    });

    // ─── Current period stats ──────────────────────────────────────────────────
    const totalWorkouts = currentPeriodWorkouts.length;
    const totalDurationSeconds = currentPeriodWorkouts.reduce(
      (sum, workout) => sum + (workout.duration_seconds ?? 0),
      0
    );
    const totalExercises = currentPeriodWorkouts.reduce(
      (sum, workout) => sum + workout.exercises.length,
      0
    );

    // ─── Previous period stats ─────────────────────────────────────────────────
    const prevWorkouts = prevPeriodWorkouts.length;
    const prevDurationSeconds = prevPeriodWorkouts.reduce(
      (sum, workout) => sum + (workout.duration_seconds ?? 0),
      0
    );
    const prevExercises = prevPeriodWorkouts.reduce(
      (sum, workout) => sum + workout.exercises.length,
      0
    );

    // ─── Trends ────────────────────────────────────────────────────────────────
    const workoutsTrend = buildTrend(totalWorkouts, prevWorkouts, (delta) => {
      const sign = delta >= 0 ? "+" : "";
      return `${sign}${delta} vs last 2w`;
    });
    const durationTrend = buildTrend(totalDurationSeconds, prevDurationSeconds, (delta) => {
      const sign = delta >= 0 ? "+" : "-";
      return `${sign}${formatDuration(Math.abs(delta))} vs last 2w`;
    });
    const exercisesTrend = buildTrend(totalExercises, prevExercises, (delta) => {
      const sign = delta >= 0 ? "+" : "";
      return `${sign}${delta} vs last 2w`;
    });

    // ─── Streak ────────────────────────────────────────────────────────────────
    const currentStreak = computeStreak(workoutData);

    // ─── All-time volume ───────────────────────────────────────────────────────
    const allTimeVolumeFormatted = `${Math.round(computeAllTimeVolume(workoutData)).toLocaleString("fi-FI")} kg`;

    // ─── Weekly frequency chart ────────────────────────────────────────────────
    const weeklyFrequency = computeWeeklyFrequency(workoutData);
    const frequencyDatasets = [
      {
        label: "Workouts",
        data: weeklyFrequency.counts,
        backgroundColor: "rgba(129, 140, 248, 0.75)",
        borderColor: "rgba(129, 140, 248, 1)",
      },
    ];

    // ─── Recent PRs ────────────────────────────────────────────────────────────
    const recentPrs = computeRecentPrs(workoutData, 5);

    // ─── Recent workouts ───────────────────────────────────────────────────────
    const recentWorkouts = [...workoutData]
      .sort(
        (workoutA, workoutB) =>
          new Date(workoutB.start_time).getTime() - new Date(workoutA.start_time).getTime()
      )
      .slice(0, 5)
      .map((workout) => ({
        uuid: workout.uuid,
        title: workout.title,
        dateFormatted: formatDate(workout.start_time),
        duration: formatDuration(workout.duration_seconds ?? 0),
        exerciseCount: workout.exercises.length,
      }));

    return {
      stats: {
        totalWorkouts,
        totalDuration: formatDuration(totalDurationSeconds),
        totalExercises,
      },
      trends: {
        workouts: workoutsTrend,
        duration: durationTrend,
        exercises: exercisesTrend,
      },
      currentStreak,
      allTimeVolumeFormatted,
      weeklyFrequency,
      frequencyDatasets,
      recentPrs,
      recentWorkouts,
    };
  } catch (err) {
    if (isHttpError(err)) throw err;
    console.error("Error loading workouts:", err);
    throw error(500, "Internal Server Error");
  }
};
