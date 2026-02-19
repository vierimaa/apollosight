<script lang="ts">
	import { PageHeader, StatCard, SectionCard, DataTable, Badge, EmptyState, BarChart } from '$lib';
	import type { WorkoutSession } from '$lib';
	import { formatDate, formatDuration, slugify } from '$lib/utils/format';
	import { Dumbbell, Clock, ListChecks, Flame, Scale } from 'lucide-svelte';

	let { data } = $props();

	// ─── Time windows ─────────────────────────────────────────────────────────
	const now = new Date();
	const currentPeriodStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
	const prevPeriodStart = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

	// ─── Period filtering ──────────────────────────────────────────────────────
	const currentPeriodWorkouts = $derived(
		(data.workoutData as WorkoutSession[]).filter(
			(workout) => new Date(workout.start_time) >= currentPeriodStart
		)
	);

	const prevPeriodWorkouts = $derived(
		(data.workoutData as WorkoutSession[]).filter((workout) => {
			const date = new Date(workout.start_time);
			return date >= prevPeriodStart && date < currentPeriodStart;
		})
	);

	// ─── Current period stats ──────────────────────────────────────────────────
	const totalWorkouts = $derived(currentPeriodWorkouts.length);
	const totalDuration = $derived(
		currentPeriodWorkouts.reduce(
			(sum: number, workout: WorkoutSession) => sum + (workout.duration_seconds ?? 0),
			0
		)
	);
	const totalExercises = $derived(
		currentPeriodWorkouts.reduce(
			(sum: number, workout: WorkoutSession) => sum + workout.exercises.length,
			0
		)
	);

	// ─── Previous period stats ─────────────────────────────────────────────────
	const prevWorkouts = $derived(prevPeriodWorkouts.length);
	const prevDuration = $derived(
		prevPeriodWorkouts.reduce(
			(sum: number, workout: WorkoutSession) => sum + (workout.duration_seconds ?? 0),
			0
		)
	);
	const prevExercises = $derived(
		prevPeriodWorkouts.reduce(
			(sum: number, workout: WorkoutSession) => sum + workout.exercises.length,
			0
		)
	);

	// ─── Delta trend builder ───────────────────────────────────────────────────
	const buildTrend = (
		current: number,
		previous: number,
		labelFn: (delta: number) => string
	): { value: number; direction: 'up' | 'down'; label: string } | undefined => {
		if (previous === 0) return undefined;
		const delta = current - previous;
		const pct = Math.round(Math.abs((delta / previous) * 100));
		const direction: 'up' | 'down' = delta >= 0 ? 'up' : 'down';
		return { value: pct, direction, label: labelFn(delta) };
	};

	const workoutsTrend = $derived(
		buildTrend(totalWorkouts, prevWorkouts, (delta) => {
			const sign = delta >= 0 ? '+' : '';
			return `${sign}${delta} vs last 2w`;
		})
	);

	const durationTrend = $derived(
		buildTrend(totalDuration, prevDuration, (delta) => {
			const sign = delta >= 0 ? '+' : '-';
			return `${sign}${formatDuration(Math.abs(delta))} vs last 2w`;
		})
	);

	const exercisesTrend = $derived(
		buildTrend(totalExercises, prevExercises, (delta) => {
			const sign = delta >= 0 ? '+' : '';
			return `${sign}${delta} vs last 2w`;
		})
	);

	// ─── Streak (consecutive weeks with ≥1 workout) ───────────────────────────
	const getWeekStart = (date: Date): Date => {
		const weekStart = new Date(date);
		const day = weekStart.getDay();
		const diff = day === 0 ? -6 : 1 - day;
		weekStart.setDate(weekStart.getDate() + diff);
		weekStart.setHours(0, 0, 0, 0);
		return weekStart;
	};

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

	const currentStreak = $derived(computeStreak(data.workoutData));

	// ─── All-time volume ───────────────────────────────────────────────────────
	const computeAllTimeVolume = (workouts: WorkoutSession[]): number => {
		let total = 0;
		for (const workout of workouts) {
			for (const exercise of workout.exercises) {
				for (const set of exercise.sets) {
					if (set.set_type === 'normal' || set.set_type === 'failure') {
						total += set.weight_kg * set.reps;
					}
				}
			}
		}
		return total;
	};

	const allTimeVolumeFormatted = $derived(
		`${Math.round(computeAllTimeVolume(data.workoutData)).toLocaleString('fi-FI')} kg`
	);

	// ─── Weekly frequency bar chart (last 12 weeks) ───────────────────────────
	interface WeeklyFrequencyData {
		labels: string[];
		counts: number[];
	}

	const computeWeeklyFrequency = (workouts: WorkoutSession[]): WeeklyFrequencyData => {
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

	const weeklyFrequency = $derived(computeWeeklyFrequency(data.workoutData));

	const frequencyDatasets = $derived([
		{
			label: 'Workouts',
			data: weeklyFrequency.counts,
			backgroundColor: 'rgba(129, 140, 248, 0.75)',
			borderColor: 'rgba(129, 140, 248, 1)'
		}
	]);

	// ─── Recent PRs ────────────────────────────────────────────────────────────
	interface PrEvent {
		date: string;
		exerciseTitle: string;
		prType: '1RM' | 'Weight';
		value: number;
	}

	const computeRecentPrs = (workouts: WorkoutSession[], count: number): PrEvent[] => {
		const sorted = [...workouts].sort(
			(workoutA, workoutB) =>
				new Date(workoutA.start_time).getTime() - new Date(workoutB.start_time).getTime()
		);

		const bestOneRM = new Map<string, number>();
		const bestWeight = new Map<string, number>();
		const prEvents: PrEvent[] = [];

		for (const workout of sorted) {
			for (const exercise of workout.exercises) {
				const exerciseTitle = exercise.exercise_title;
				const validSets = exercise.sets.filter(
					(set) => set.set_type === 'normal' || set.set_type === 'failure'
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

				if (sessionMaxOneRM > 0 && prevBestOneRM > 0 && sessionMaxOneRM > prevBestOneRM) {
					prEvents.push({
						date: workout.start_time,
						exerciseTitle,
						prType: '1RM',
						value: Math.round(sessionMaxOneRM * 10) / 10
					});
				}
				if (sessionMaxWeight > 0 && prevBestWeight > 0 && sessionMaxWeight > prevBestWeight) {
					prEvents.push({
						date: workout.start_time,
						exerciseTitle,
						prType: 'Weight',
						value: sessionMaxWeight
					});
				}

				if (sessionMaxOneRM > prevBestOneRM) bestOneRM.set(exerciseTitle, sessionMaxOneRM);
				if (sessionMaxWeight > prevBestWeight) bestWeight.set(exerciseTitle, sessionMaxWeight);
			}
		}

		return prEvents
			.sort(
				(eventA, eventB) =>
					new Date(eventB.date).getTime() - new Date(eventA.date).getTime()
			)
			.slice(0, count);
	};

	const recentPrs = $derived(computeRecentPrs(data.workoutData, 5));

	// ─── Recent workouts table ─────────────────────────────────────────────────
	const recentWorkoutsList = $derived(
		[...data.workoutData]
			.sort(
				(workoutA: WorkoutSession, workoutB: WorkoutSession) =>
					new Date(workoutB.start_time).getTime() - new Date(workoutA.start_time).getTime()
			)
			.slice(0, 5)
	);
</script>

<PageHeader title="Dashboard" />

<div class="p-6 space-y-6">
	<!-- Stats Grid -->
	<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
		<StatCard title="Workouts (2 weeks)" value={totalWorkouts} trend={workoutsTrend}>
			{#snippet icon()}
				<Dumbbell class="w-8 h-8" />
			{/snippet}
		</StatCard>

		<StatCard title="Duration (2 weeks)" value={formatDuration(totalDuration)} trend={durationTrend}>
			{#snippet icon()}
				<Clock class="w-8 h-8" />
			{/snippet}
		</StatCard>

		<StatCard title="Exercises (2 weeks)" value={totalExercises} trend={exercisesTrend}>
			{#snippet icon()}
				<ListChecks class="w-8 h-8" />
			{/snippet}
		</StatCard>

		<StatCard
			title="Current Streak"
			value="{currentStreak} {currentStreak === 1 ? 'week' : 'weeks'}"
		>
			{#snippet icon()}
				<Flame class="w-8 h-8" />
			{/snippet}
		</StatCard>

		<StatCard title="All-time Volume" value={allTimeVolumeFormatted}>
			{#snippet icon()}
				<Scale class="w-8 h-8" />
			{/snippet}
		</StatCard>
	</div>

	<!-- Weekly Frequency Chart -->
	<SectionCard title="Weekly Training Frequency">
		{#snippet children()}
			<BarChart labels={weeklyFrequency.labels} datasets={frequencyDatasets} />
		{/snippet}
	</SectionCard>

	<!-- Recent PRs -->
	<SectionCard title="Recent Personal Bests">
		{#snippet children()}
			{#if recentPrs.length === 0}
				<EmptyState message="No personal records detected yet." />
			{:else}
				<DataTable>
					<thead>
						<tr>
							<th>Date</th>
							<th>Exercise</th>
							<th>Type</th>
							<th>Value</th>
						</tr>
					</thead>
					<tbody>
						{#each recentPrs as prEvent}
							<tr>
								<td>{formatDate(prEvent.date)}</td>
								<td>
									<a
										href="/exercises/{slugify(prEvent.exerciseTitle)}"
										class="text-primary-500 hover:underline"
									>
										{prEvent.exerciseTitle}
									</a>
								</td>
								<td>
									<Badge
										label={prEvent.prType}
										variant={prEvent.prType === '1RM' ? 'success' : 'info'}
									/>
								</td>
								<td>{prEvent.value} kg</td>
							</tr>
						{/each}
					</tbody>
				</DataTable>
			{/if}
		{/snippet}
	</SectionCard>

	<!-- Recent Workouts -->
	<SectionCard title="Recent Workouts">
		{#snippet children()}
			<DataTable>
				<thead>
					<tr>
						<th>Date</th>
						<th>Title</th>
						<th>Duration</th>
						<th>Exercises</th>
					</tr>
				</thead>
				<tbody>
					{#each recentWorkoutsList as workout}
						<tr>
							<td>{formatDate(workout.start_time)}</td>
							<td>
								<a href="/workouts/{workout.uuid}" class="text-primary-500 hover:underline">
									{workout.title}
								</a>
							</td>
							<td>{formatDuration(workout.duration_seconds)}</td>
							<td>{workout.exercises.length}</td>
						</tr>
					{/each}
				</tbody>
			</DataTable>
		{/snippet}
	</SectionCard>
</div>
