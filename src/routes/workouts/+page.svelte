<script lang="ts">
	import { PageHeader, SectionCard, StatCard, DataTable } from '$lib';
	import type { WorkoutSession } from '$lib';
	import { formatDate, formatDuration } from '$lib/utils/format';
	import { Activity } from 'lucide-svelte';

	let { data } = $props();

	interface CalendarDay {
		date: string;
		count: number;
	}

	// Group workouts by date for the heatmap
	const getWorkoutCountsByDate = () => {
		const counts = new Map<string, number>();

		for (const workout of data.jsonData as WorkoutSession[]) {
			const date = new Date(workout.start_time).toISOString().split('T')[0];
			counts.set(date, (counts.get(date) || 0) + 1);
		}

		return counts;
	};

	// Generate calendar data for the last year
	const generateCalendarData = () => {
		const today = new Date();
		const workoutCounts = getWorkoutCountsByDate();
		const days: CalendarDay[] = [];

		// Get days for the last year
		for (let dayOffset = 0; dayOffset < 371; dayOffset++) {
			// 53 weeks * 7 days to ensure full weeks
			const date = new Date(today);
			date.setDate(date.getDate() - dayOffset);
			const dateStr = date.toISOString().split('T')[0];
			days.push({
				date: dateStr,
				count: workoutCounts.get(dateStr) || 0
			});
		}

		// Pad the beginning to align with the week (Monday = 1, Sunday = 0)
		const firstDay = new Date(days[days.length - 1].date);
		let dayOfWeek = firstDay.getDay() - 1;
		if (dayOfWeek === -1) dayOfWeek = 6; // Convert Sunday from 0 to 6

		// Add padding days at the start to align with Monday
		for (let paddingIndex = 0; paddingIndex < dayOfWeek; paddingIndex++) {
			const paddingDate = new Date(firstDay);
			paddingDate.setDate(paddingDate.getDate() - (paddingIndex + 1));
			days.push({
				date: paddingDate.toISOString().split('T')[0],
				count: 0
			});
		}

		return days.reverse();
	};

	const activityData = $derived(generateCalendarData());

	interface MonthLabel {
		name: string;
		weekIndex: number;
	}

	// Compute month labels: first column where each new month starts
	const monthLabels = $derived.by(() => {
		const labels: MonthLabel[] = [];
		let lastMonth = -1;
		for (let dayIndex = 0; dayIndex < activityData.length; dayIndex++) {
			const date = new Date(activityData[dayIndex].date);
			const month = date.getMonth();
			if (month !== lastMonth) {
				lastMonth = month;
				labels.push({
					name: date.toLocaleString('default', { month: 'short' }),
					weekIndex: Math.floor(dayIndex / 7)
				});
			}
		}
		return labels;
	});

	// Helper to get color based on workout count
	const getBackgroundColor = (count: number) => {
		if (count === 0) return 'var(--color-surface-300)';
		if (count === 1) return 'var(--color-primary-400)';
		return 'var(--color-primary-500)';
	};

	// Sort workouts by date (newest first)
	const sortedWorkouts = $derived(
		[...data.jsonData as WorkoutSession[]].sort(
			(workoutA, workoutB) => new Date(workoutB.start_time).getTime() - new Date(workoutA.start_time).getTime()
		)
	);
</script>

<PageHeader title="Workouts">
	{#snippet actions()}
		<StatCard title="Total" value={data.jsonData.length} class="!p-3 !shadow-none">
			{#snippet icon()}
				<Activity class="w-5 h-5" />
			{/snippet}
		</StatCard>
	{/snippet}
</PageHeader>

<div class="p-6 space-y-6">
	<!-- Activity Heatmap -->
	<SectionCard title="Activity Heatmap">
		{#snippet children()}
			<div class="activity-calendar">
				<div class="calendar-container">
					<div class="weekdays">
						<span style="grid-row: 1">Mon</span>
						<span style="grid-row: 3">Wed</span>
						<span style="grid-row: 5">Fri</span>
						<span style="grid-row: 7">Sun</span>
					</div>

					<div class="contribution-graph">
						<!-- Month labels: absolutely positioned above the grid -->
						<div class="months-row">
							{#each monthLabels as label}
								<span class="month-label" style="left: {label.weekIndex * 17}px">
									{label.name}
								</span>
							{/each}
						</div>

						<div class="calendar-grid">
							{#each activityData as day}
								<div
									class="day"
									style="background-color: {getBackgroundColor(day.count)}"
									title="{day.date}: {day.count} workout{day.count !== 1 ? 's' : ''}"
								></div>
							{/each}
						</div>
					</div>
				</div>

				<div class="legend">
					<div class="legend-item" style="background-color: {getBackgroundColor(0)}"></div>
					<span class="text-surface-600-400">Rest day</span>
					<div class="legend-item" style="background-color: {getBackgroundColor(1)}"></div>
					<span class="text-surface-600-400">Workout</span>
				</div>
			</div>
		{/snippet}
	</SectionCard>

	<!-- Workout Sessions Table -->
	<SectionCard title="All Sessions">
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
					{#each sortedWorkouts as workout}
						<tr>
							<td>{formatDate(workout.start_time)}</td>
							<td>
								<a href="/workouts/{workout.uuid}" class="text-primary-500 hover:underline">
									{workout.title}
								</a>
							</td>
							<td>{formatDuration(workout.duration_seconds ?? 0)}</td>
							<td>{workout.exercises.length}</td>
						</tr>
					{/each}
				</tbody>
			</DataTable>
		{/snippet}
	</SectionCard>
</div>

<style>
	.activity-calendar {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin: 0 auto;
		font-size: 0.8rem;
		width: fit-content;
	}

	.calendar-container {
		display: flex;
		gap: 4px;
	}

	.weekdays {
		display: grid;
		grid-template-rows: repeat(7, 15px);
		gap: 2px;
		padding-top: 24px; /* matches .months-row height */
		padding-right: 6px;
		color: rgb(var(--color-surface-600) / 0.8);
		text-align: end;
		font-size: 0.7rem;
		align-items: center;
	}

	.contribution-graph {
		flex: 1;
	}

	.months-row {
		position: relative;
		height: 20px;
		margin-bottom: 4px;
	}

	.month-label {
		position: absolute;
		bottom: 0;
		color: rgb(var(--color-surface-600) / 0.8);
		font-size: 0.7rem;
		white-space: nowrap;
	}

	.calendar-grid {
		display: grid;
		grid-template-columns: repeat(53, 15px);
		grid-auto-flow: column;
		grid-template-rows: repeat(7, 15px);
		gap: 2px;
		justify-content: center;
	}

	.legend {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		justify-content: center;
		margin-top: 0.5rem;
		font-size: 0.7rem;
	}

	.legend-item {
		width: 10px;
		height: 10px;
		border-radius: 2px;
	}

	.day {
		width: 15px;
		height: 15px;
		border-radius: 2px;
		transition: transform 0.1s ease-in-out;
	}

	.day:hover {
		transform: scale(1.2);
	}
</style>

