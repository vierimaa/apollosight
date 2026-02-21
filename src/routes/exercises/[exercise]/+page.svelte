<script lang="ts">
	import { PageHeader, SectionCard, DataTable, LineChart, BarChart, Badge, EmptyState, StatCard } from '$lib';
	import type { ExerciseHistoryEntry } from '$lib';
	import { formatDate, formatVolume } from '$lib/utils/format';
	import { Tabs } from '@skeletonlabs/skeleton-svelte';
	import { ArrowLeft, ExternalLink, Dumbbell, Scale, TrendingUp, Activity } from 'lucide-svelte';

	const { data } = $props();
	const exerciseTitle = $derived(data.exerciseTitle);
	const exerciseHistory = $derived(data.exerciseHistory as ExerciseHistoryEntry[]);

	// Summary stats pre-computed server-side
	const totalSessions = $derived(data.totalSessions as number);
	const bestWeight = $derived(data.bestWeight as number);
	const bestOneRM = $derived(data.bestOneRM as number);
	const allTimeVolume = $derived(data.allTimeVolume as number);

	// --- Time Range Filter ---
	let timeRange = $state<'4w' | '3m' | '6m' | '9m' | 'all'>('all');

	const filterByTimeRange = (history: ExerciseHistoryEntry[]): ExerciseHistoryEntry[] => {
		if (timeRange === 'all') return history;
		const now = new Date();
		let cutoff: Date;
		if (timeRange === '4w') {
			cutoff = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
		} else if (timeRange === '3m') {
			cutoff = new Date(now);
			cutoff.setMonth(now.getMonth() - 3);
		} else if (timeRange === '6m') {
			cutoff = new Date(now);
			cutoff.setMonth(now.getMonth() - 6);
		} else {
			// '9m'
			cutoff = new Date(now);
			cutoff.setMonth(now.getMonth() - 9);
		}
		return history.filter((entry) => new Date(entry.workout_date) >= cutoff);
	};

	const filteredHistory = $derived(filterByTimeRange(exerciseHistory));

	// exerciseHistory arrives pre-sorted ascending from the server;
	// filtering preserves that order, so filteredHistory is ready for charts.

	// --- Chart data ---
	const labels = $derived(
		filteredHistory.map((entry) => new Date(entry.workout_date).toLocaleDateString('fi-FI'))
	);

	const maxWeights = $derived(
		filteredHistory.map((entry) => Math.max(...entry.sets.map((set) => set.weight_kg)))
	);

	const oneRepMax = $derived(
		filteredHistory.map((entry) =>
			Math.max(...entry.sets.map((set) => set.weight_kg * (1 + 0.0333 * set.reps)))
		)
	);

	const bestSet = $derived(
		filteredHistory.map((entry) => Math.max(...entry.sets.map((set) => set.weight_kg * set.reps)))
	);

	const sessionVolume = $derived(
		filteredHistory.map((entry) =>
			entry.sets.reduce((total, set) => total + set.weight_kg * set.reps, 0)
		)
	);

	const sessionReps = $derived(
		filteredHistory.map((entry) => entry.sets.reduce((total, set) => total + set.reps, 0))
	);

	const chartConfigs = $derived([
		{
			id: 'maxWeight',
			label: 'Max Weight',
			data: maxWeights,
			color: '#1976d2',
			bgColor: 'rgba(25, 118, 210, 0.2)',
			yAxisBeginAtZero: false
		},
		{
			id: 'oneRepMax',
			label: '1RM',
			data: oneRepMax,
			color: '#4caf50',
			bgColor: 'rgba(76, 175, 80, 0.2)',
			yAxisBeginAtZero: false
		},
		{
			id: 'bestSet',
			label: 'Best Set',
			data: bestSet,
			color: '#ff9800',
			bgColor: 'rgba(255, 152, 0, 0.2)',
			yAxisBeginAtZero: true
		},
		{
			id: 'sessionVolume',
			label: 'Session Volume',
			data: sessionVolume,
			color: '#9c27b0',
			bgColor: 'rgba(156, 39, 176, 0.4)',
			yAxisBeginAtZero: true
		},
		{
			id: 'sessionReps',
			label: 'Session Reps',
			data: sessionReps,
			color: '#f44336',
			bgColor: 'rgba(244, 67, 54, 0.2)',
			yAxisBeginAtZero: true
		}
	]);

	let activeChartIndex = $state('0');

	const timeRangeOptions = [
		{ value: '4w' as const, label: '4 weeks' },
		{ value: '3m' as const, label: '3 months' },
		{ value: '6m' as const, label: '6 months' },
		{ value: '9m' as const, label: '9 months' },
		{ value: 'all' as const, label: 'All time' }
	];

	const getBadgeVariant = (setType: string): 'default' | 'error' | 'warning' => {
		if (setType === 'failure') return 'error';
		if (setType === 'warmup') return 'warning';
		return 'default';
	};
</script>

<PageHeader title={exerciseTitle}>
	{#snippet back()}
		<a
			href="/exercises"
			class="flex items-center gap-1.5 text-sm text-surface-600-400 hover:text-surface-900-100"
		>
			<ArrowLeft class="w-3.5 h-3.5" />
			Back to Exercises
		</a>
	{/snippet}
</PageHeader>

<div class="p-6 space-y-6">
	<!-- Summary Stats -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
		<StatCard title="Sessions" value={totalSessions} class="!p-4">
			{#snippet icon()}
				<Dumbbell class="w-6 h-6" />
			{/snippet}
		</StatCard>
		<StatCard title="Best Weight" value="{bestWeight} kg" class="!p-4">
			{#snippet icon()}
				<Scale class="w-6 h-6" />
			{/snippet}
		</StatCard>
		<StatCard title="Best 1RM" value="{Math.round(bestOneRM)} kg" class="!p-4">
			{#snippet icon()}
				<TrendingUp class="w-6 h-6" />
			{/snippet}
		</StatCard>
		<StatCard title="Total Volume" value={formatVolume(allTimeVolume)} class="!p-4">
			{#snippet icon()}
				<Activity class="w-6 h-6" />
			{/snippet}
		</StatCard>
	</div>

	<!-- Progress Charts -->
	<SectionCard title="Progress Charts">
		{#snippet headerAction()}
			<div class="flex gap-2 flex-wrap">
				{#each timeRangeOptions as option}
					<button
						onclick={() => (timeRange = option.value)}
						class="px-3 py-1.5 text-sm rounded-lg transition-colors
							{timeRange === option.value
							? 'bg-primary-500 text-white'
							: 'bg-surface-200-800 text-surface-700-300 hover:bg-surface-300-700'}"
					>
						{option.label}
					</button>
				{/each}
			</div>
		{/snippet}

		{#snippet children()}
			{#if filteredHistory.length === 0}
				<EmptyState message="No sessions in this time range.">
					{#snippet action()}
						<button
							onclick={() => (timeRange = 'all')}
							class="px-4 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
						>
							Show all time
						</button>
					{/snippet}
				</EmptyState>
			{:else}
				<Tabs value={activeChartIndex} onValueChange={(event) => (activeChartIndex = event.value)}>
					<Tabs.List class="mb-6 flex flex-wrap gap-2">
						{#each chartConfigs as config, index}
							<Tabs.Trigger
								value={String(index)}
								class="px-4 py-2 rounded-lg transition-colors data-[selected]:bg-primary-500
									data-[selected]:text-white bg-surface-200-800 text-surface-700-300"
							>
								{config.label}
							</Tabs.Trigger>
						{/each}
					</Tabs.List>

					{#each chartConfigs as config, index}
						<Tabs.Content value={String(index)}>
							<div class="h-[400px]">
								{#if config.id === 'sessionVolume'}
									<BarChart
										labels={labels}
										datasets={[
											{
												label: config.label,
												data: config.data,
												backgroundColor: config.bgColor,
												borderColor: config.color
											}
										]}
									/>
								{:else}
									<LineChart
										labels={labels}
										datasets={[
											{
												label: config.label,
												data: config.data,
												borderColor: config.color,
												backgroundColor: config.bgColor
											}
										]}
										yAxisBeginAtZero={config.yAxisBeginAtZero}
									/>
								{/if}
							</div>
						</Tabs.Content>
					{/each}
				</Tabs>
			{/if}
		{/snippet}
	</SectionCard>

	<!-- Workout History -->
	<SectionCard title="Workout History">
		{#snippet children()}
			{#if filteredHistory.length === 0}
				<EmptyState message="No sessions in this time range." />
			{:else}
				<div class="space-y-4">
					{#each filteredHistory.toReversed() as entry}
						<div class="preset-filled-surface-200-800 rounded-lg p-4">
							<div class="flex items-center justify-between mb-3">
								<h3 class="text-lg font-semibold text-surface-950-50">
									{formatDate(entry.workout_date)}
								</h3>
								<a
									href="/workouts/{entry.workout_uuid}"
									class="flex items-center gap-1 text-sm text-primary-500 hover:underline"
								>
									View Workout
									<ExternalLink class="w-3.5 h-3.5" />
								</a>
							</div>
							{#if entry.exercise_notes}
								<p class="text-sm text-surface-950-50 mb-3 italic">
									{entry.exercise_notes}
								</p>
							{/if}
							<DataTable>
								<thead>
									<tr>
										<th>Set</th>
										<th>Type</th>
										<th>Weight (kg)</th>
										<th>Reps</th>
										<th>Volume</th>
										<th>RPE</th>
									</tr>
								</thead>
								<tbody>
									{#each entry.sets as set}
										<tr>
											<td>{+set.set_index + 1}</td>
											<td>
												<Badge label={set.set_type} variant={getBadgeVariant(set.set_type)} />
											</td>
											<td>{set.weight_kg}</td>
											<td>{set.reps}</td>
											<td class="text-surface-600-400">{set.weight_kg * set.reps}</td>
											<td>{set.rpe != null ? set.rpe : '—'}</td>
										</tr>
									{/each}
								</tbody>
							</DataTable>
						</div>
					{/each}
				</div>
			{/if}
		{/snippet}
	</SectionCard>
</div>
