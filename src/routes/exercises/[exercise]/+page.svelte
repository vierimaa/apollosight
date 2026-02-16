<script lang="ts">
	import { PageHeader, SectionCard, DataTable, Badge, LineChart } from '$lib';
	import { formatDate } from '$lib/utils/format';
	import { Tabs } from '@skeletonlabs/skeleton-svelte';
	import { ArrowLeft } from 'lucide-svelte';

	const { data } = $props();
	const exerciseName = $derived(data.exerciseName);
	const exerciseHistory = $derived(data.exerciseHistory);

	interface SetEntry {
		set_index: number;
		weight_kg: number;
		reps: number;
	}

	// --- Time Range Filter ---
	let timeRange = $state<'4w' | '3m' | '6m' | '9m' | 'all'>('all');

	function filterByTimeRange(history: any) {
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
		} else if (timeRange === '9m') {
			cutoff = new Date(now);
			cutoff.setMonth(now.getMonth() - 9);
		} else {
			return history;
		}
		return history.filter((entry: any) => new Date(entry.workout_date) >= cutoff);
	}

	const filteredHistory = $derived(filterByTimeRange(exerciseHistory));

	// Sort history by date ascending
	const sortedHistory = $derived(
		[...filteredHistory].sort(
			(a: any, b: any) => new Date(a.workout_date).getTime() - new Date(b.workout_date).getTime()
		)
	);

	// Prepare chart data
	const labels = $derived(
		sortedHistory.map((entry: any) => new Date(entry.workout_date).toLocaleDateString('fi-FI'))
	);

	const maxWeights = $derived(
		sortedHistory.map((entry: any) => Math.max(...entry.sets.map((set: SetEntry) => set.weight_kg)))
	);

	const oneRepMax = $derived(
		sortedHistory.map((entry: any) =>
			Math.max(
				...entry.sets.map((set: SetEntry) => set.weight_kg * (1 + 0.0333 * set.reps))
			)
		)
	);

	const setVolume = $derived(
		sortedHistory.map((entry: any) =>
			Math.max(...entry.sets.map((set: SetEntry) => set.weight_kg * set.reps))
		)
	);

	const sessionVolume = $derived(
		sortedHistory.map((entry: any) =>
			entry.sets.reduce(
				(total: number, set: SetEntry) => total + set.weight_kg * set.reps,
				0
			)
		)
	);

	const sessionReps = $derived(
		sortedHistory.map((entry: any) =>
			entry.sets.reduce((total: number, set: SetEntry) => total + set.reps, 0)
		)
	);

	const chartConfigs = $derived([
		{
			id: 'maxWeight',
			label: 'Max Weight',
			data: maxWeights,
			color: '#1976d2',
			bgColor: 'rgba(25, 118, 210, 0.2)'
		},
		{
			id: 'oneRepMax',
			label: '1RM',
			data: oneRepMax,
			color: '#4caf50',
			bgColor: 'rgba(76, 175, 80, 0.2)'
		},
		{
			id: 'setVolume',
			label: 'Set Volume',
			data: setVolume,
			color: '#ff9800',
			bgColor: 'rgba(255, 152, 0, 0.2)'
		},
		{
			id: 'sessionVolume',
			label: 'Session Volume',
			data: sessionVolume,
			color: '#9c27b0',
			bgColor: 'rgba(156, 39, 176, 0.2)'
		},
		{
			id: 'sessionReps',
			label: 'Session Reps',
			data: sessionReps,
			color: '#f44336',
			bgColor: 'rgba(244, 67, 54, 0.2)'
		}
	]);

	let activeChartIndex = $state('0');

	function prettifyExerciseName(slug: string) {
		return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
	}

	const timeRangeOptions = [
		{ value: '4w' as const, label: '4 weeks' },
		{ value: '3m' as const, label: '3 months' },
		{ value: '6m' as const, label: '6 months' },
		{ value: '9m' as const, label: '9 months' },
		{ value: 'all' as const, label: 'All time' }
	];
</script>

<PageHeader title={prettifyExerciseName(exerciseName)}>
	{#snippet actions()}
		<a
			href="/exercises"
			class="flex items-center gap-2 text-surface-600-400 hover:text-surface-900-100"
		>
			<ArrowLeft class="w-4 h-4" />
			<span class="text-sm">Back to Exercises</span>
		</a>
	{/snippet}
</PageHeader>

<div class="p-6 space-y-6">
	<!-- Chart Section -->
	<SectionCard title="Progress Charts">
		{#snippet headerAction()}
			<div class="flex gap-2">
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
			<!-- Chart Tabs -->
			<Tabs value={activeChartIndex} onValueChange={(e) => (activeChartIndex = e.value)}>
				<Tabs.List class="mb-6 flex-wrap gap-2">
					{#each chartConfigs as config, i}
						<Tabs.Trigger
							value={String(i)}
							class="px-4 py-2 rounded-lg transition-colors data-[selected]:bg-primary-500 
								data-[selected]:text-white bg-surface-200-800 text-surface-700-300"
						>
							{config.label}
						</Tabs.Trigger>
					{/each}
				</Tabs.List>

				{#each chartConfigs as config, i}
					<Tabs.Content value={String(i)}>
						<div class="h-[400px]">
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
							/>
						</div>
					</Tabs.Content>
				{/each}
			</Tabs>
		{/snippet}
	</SectionCard>

	<!-- Workout History -->
	<SectionCard title="Workout History">
		{#snippet children()}
			<div class="space-y-4">
				{#each [...filteredHistory].sort((a: any, b: any) => new Date(b.workout_date).getTime() - new Date(a.workout_date).getTime()) as entry}
					<div class="preset-filled-surface-200-800 rounded-lg p-4">
						<h3 class="text-lg font-semibold text-surface-950-50 mb-3">
							{formatDate(entry.workout_date)}
						</h3>
						<DataTable>
							<thead>
								<tr>
									<th>Set</th>
									<th>Weight (kg)</th>
									<th>Reps</th>
									<th>Volume</th>
								</tr>
							</thead>
							<tbody>
								{#each entry.sets as set}
									<tr>
										<td>{+set.set_index + 1}</td>
										<td>{set.weight_kg}</td>
										<td>{set.reps}</td>
										<td class="text-surface-600-400">{set.weight_kg * set.reps}</td>
									</tr>
								{/each}
							</tbody>
						</DataTable>
					</div>
				{/each}
			</div>
		{/snippet}
	</SectionCard>
</div>

