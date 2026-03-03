<script lang="ts">
	import { PageHeader, SectionCard, StatCard, DataTable, BarChart, LineChart } from '$lib';
	import { formatDate, formatDuration } from '$lib/utils/format';
	import { Activity } from 'lucide-svelte';

	let { data } = $props();

	// Helper to get color based on workout count
	const getBackgroundColor = (count: number) => {
		if (count === 0) return 'var(--color-surface-300)';
		if (count === 1) return 'var(--color-primary-400)';
		return 'var(--color-primary-500)';
	};

	// ─── Time range filter ──────────────────────────────────────────────────────
	type TimeRange = '3m' | '6m' | '1y' | 'all';
	let timeRange = $state<TimeRange>('all');

	const filterByTimeRange = (workouts: typeof data.workouts): typeof data.workouts => {
		if (timeRange === 'all') return workouts;
		const cutoff = new Date();
		if (timeRange === '3m') cutoff.setMonth(cutoff.getMonth() - 3);
		else if (timeRange === '6m') cutoff.setMonth(cutoff.getMonth() - 6);
		else cutoff.setFullYear(cutoff.getFullYear() - 1);
		return workouts.filter((workout) => new Date(workout.start_time) >= cutoff);
	};

	const filteredWorkouts = $derived(filterByTimeRange(data.workouts));

	// ─── Monthly charts (last 12 months, pre-computed server-side) ─────────────
	const volumeDatasets = $derived([
		{
			label: 'Total volume (kg)',
			data: data.monthlyChartData.volumeData,
			backgroundColor: 'rgba(129, 140, 248, 0.75)',
			borderColor: 'rgba(129, 140, 248, 1)'
		}
	]);

	const durationDatasets = $derived([
		{
			label: 'Avg duration (min)',
			data: data.monthlyChartData.avgDurationData,
			borderColor: 'rgba(52, 211, 153, 1)',
			backgroundColor: 'rgba(52, 211, 153, 0.1)'
		}
	]);
</script>

<PageHeader title="Workouts">
	{#snippet actions()}
		<StatCard title="Total" value={data.workouts.length} class="!p-3 !shadow-none">
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
							{#each data.calendarMonthLabels as label (`${label.name}-${label.weekIndex}`)}
								<span class="month-label" style="left: {label.weekIndex * 17}px">{label.name}</span>
							{/each}
						</div>

						<div class="calendar-grid">
							{#each data.calendarDays as day (day.date)}
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

	<!-- Monthly Volume Chart -->
	<SectionCard title="Monthly Volume">
		{#snippet children()}
			<div class="h-64">
				<BarChart
					labels={data.monthlyChartData.labels}
					datasets={volumeDatasets}
					title="Total kg lifted per month"
				/>
			</div>
		{/snippet}
	</SectionCard>

	<!-- Avg Session Duration Chart -->
	<SectionCard title="Avg Session Duration">
		{#snippet children()}
			<div class="h-64">
				<LineChart
					labels={data.monthlyChartData.labels}
					datasets={durationDatasets}
					title="Average session duration per month (min)"
				/>
			</div>
		{/snippet}
	</SectionCard>

	<!-- Workout Sessions Table -->
	<SectionCard title="All Sessions">
		{#snippet headerAction()}
			<div class="flex gap-1">
				{#each (['3m', '6m', '1y', 'all'] as TimeRange[]) as range (range)}
					<button
						class="btn btn-sm {timeRange === range ? 'preset-filled' : 'preset-tonal'}"
						onclick={() => (timeRange = range)}
					>
						{range === 'all' ? 'All' : range}
					</button>
				{/each}
			</div>
		{/snippet}
		{#snippet children()}
			<DataTable>
				<thead>
					<tr>
						<th>Date</th>
						<th>Title</th>
						<th>Duration</th>
						<th>Exercises</th>
						<th>Sets</th>
						<th>Volume</th>
					</tr>
				</thead>
				<tbody>
					{#each filteredWorkouts as workout (workout.uuid)}
						<tr>
							<td>{formatDate(workout.start_time)}</td>
							<td>
								<a href="/workouts/{workout.uuid}" class="text-primary-500 hover:underline">
									{workout.title}
								</a>
							</td>
							<td>{formatDuration(workout.duration_seconds ?? 0)}</td>
							<td>{workout.exerciseCount}</td>
							<td>{workout.totalSets}</td>
							<td>{Math.round(workout.volume).toLocaleString('fi-FI')} kg</td>
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

