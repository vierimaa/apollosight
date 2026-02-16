<script lang="ts">
	import { PageHeader, SectionCard, StatCard, DataTable } from '$lib';
	import { formatDate, formatDuration } from '$lib/utils/format';
	import { Activity } from 'lucide-svelte';

	let { data } = $props();

	interface Workout {
		uuid: string;
		title: string;
		start_time: string;
		duration_seconds: number;
		exercises: any[];
	}

	interface CalendarDay {
		date: string;
		count: number;
	}

	// Group workouts by date for the heatmap
	const getWorkoutCountsByDate = () => {
		const counts = new Map<string, number>();

		data.jsonData.forEach((workout: Workout) => {
			const date = new Date(workout.start_time).toISOString().split('T')[0];
			counts.set(date, (counts.get(date) || 0) + 1);
		});

		return counts;
	};

	// Generate calendar data for the last year
	const generateCalendarData = () => {
		const today = new Date();
		const workoutCounts = getWorkoutCountsByDate();
		const days: CalendarDay[] = [];

		// Get days for the last year
		for (let i = 0; i < 371; i++) {
			// 53 weeks * 7 days to ensure full weeks
			const date = new Date(today);
			date.setDate(date.getDate() - i);
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
		for (let i = 0; i < dayOfWeek; i++) {
			const paddingDate = new Date(firstDay);
			paddingDate.setDate(paddingDate.getDate() - (i + 1));
			days.push({
				date: paddingDate.toISOString().split('T')[0],
				count: 0
			});
		}

		return days.reverse();
	};

	const activityData = $derived(generateCalendarData());

	// Helper to get color based on workout count
	const getBackgroundColor = (count: number) => {
		return count > 0 ? '#40c463' : 'var(--color-surface-200)';
	};

	// Sort workouts by date (newest first)
	const sortedWorkouts = $derived(
		[...data.jsonData].sort(
			(a: Workout, b: Workout) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
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
						<div>Mon</div>
						<div>Wed</div>
						<div>Fri</div>
						<div>Sun</div>
					</div>

					<div class="contribution-graph">
						<div class="months">
							{#each activityData
								.filter((_, i) => i % 7 === 0)
								.filter((day, i) => {
									const date = new Date(day.date);
									const prevDate = i > 0 ? new Date(activityData[Math.max(0, i * 7 - 7)].date) : null;
									return !prevDate || date.getMonth() !== prevDate.getMonth();
								})
								.map((day) => {
									const date = new Date(day.date);
									return {
										name: date.toLocaleString('default', { month: 'short' }),
										weekIndex: Math.floor(activityData.findIndex((d) => d.date === day.date) / 7)
									};
								}) as month}
								<div class="month-label" style="grid-column-start: {month.weekIndex + 1}">
									{month.name}
								</div>
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
							<td>{formatDuration(workout.duration_seconds)}</td>
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
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding: 32px 4px 0 0;
		color: rgb(var(--color-surface-600) / 0.8);
		text-align: end;
		font-size: 0.7rem;
		height: 119px;
	}

	.contribution-graph {
		flex: 1;
	}

	.months {
		display: grid;
		grid-template-columns: repeat(53, 15px);
		gap: 2px;
		padding-bottom: 4px;
		justify-content: center;
	}

	.month-label {
		color: rgb(var(--color-surface-600) / 0.8);
		font-size: 0.7rem;
		position: relative;
		grid-column-end: span 4;
		text-align: start;
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

