<script lang="ts">
	import {
		PageHeader,
		SectionCard,
		DataTable,
		LineChart,
		BarChart,
		StatCard,
		EmptyState
	} from '$lib';
	import { formatDuration, formatVolume, formatDate } from '$lib/utils/format';
	import { ArrowLeft, Layers, Activity, TrendingUp, Clock, ExternalLink } from 'lucide-svelte';

	const { data } = $props();
</script>

<PageHeader title={data.programTitle}>
	{#snippet back()}
		<a
			href="/programs"
			class="flex items-center gap-1.5 text-sm text-surface-600-400 hover:text-surface-900-100"
		>
			<ArrowLeft class="w-3.5 h-3.5" />
			Back to Programs
		</a>
	{/snippet}
</PageHeader>

<div class="p-6 space-y-6">
	<!-- Summary Stats -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
		<StatCard title="Sessions" value={data.totalSessions} class="!p-4">
			{#snippet icon()}
				<Layers class="w-6 h-6" />
			{/snippet}
		</StatCard>
		<StatCard title="All-Time Volume" value={formatVolume(data.allTimeVolume)} class="!p-4">
			{#snippet icon()}
				<Activity class="w-6 h-6" />
			{/snippet}
		</StatCard>
		<StatCard title="Avg Volume / Session" value={formatVolume(data.avgVolume)} class="!p-4">
			{#snippet icon()}
				<TrendingUp class="w-6 h-6" />
			{/snippet}
		</StatCard>
		<StatCard
			title="Avg Duration"
			value={data.avgDuration != null ? formatDuration(data.avgDuration) : '—'}
			class="!p-4"
		>
			{#snippet icon()}
				<Clock class="w-6 h-6" />
			{/snippet}
		</StatCard>
	</div>

	<!-- Volume per Session -->
	<SectionCard title="Volume per Session">
		{#snippet children()}
			<div class="h-[300px]">
				<LineChart
					labels={data.chartLabels}
					datasets={[
						{
							label: 'Volume (kg)',
							data: data.volumeData,
							borderColor: '#9c27b0',
							backgroundColor: 'rgba(156, 39, 176, 0.2)'
						}
					]}
					yAxisBeginAtZero={true}
				/>
			</div>
		{/snippet}
	</SectionCard>

	<!-- Duration per Session -->
	<SectionCard title="Duration per Session">
		{#snippet children()}
			{#if data.durationData.every((d: number | null) => d == null)}
				<EmptyState message="No duration data available for this program." />
			{:else}
				<div class="h-[300px]">
					<LineChart
						labels={data.chartLabels}
						datasets={[
							{
								label: 'Duration (min)',
								data: data.durationData,
								borderColor: '#1976d2',
								backgroundColor: 'rgba(25, 118, 210, 0.2)'
							}
						]}
						yAxisBeginAtZero={true}
					/>
				</div>
			{/if}
		{/snippet}
	</SectionCard>

	<!-- Sets per Session -->
	<SectionCard title="Sets per Session">
		{#snippet children()}
			<div class="h-[300px]">
				<BarChart
					labels={data.chartLabels}
					datasets={[
						{
							label: 'Sets',
							data: data.setsData,
							backgroundColor: 'rgba(76, 175, 80, 0.4)',
							borderColor: '#4caf50'
						}
					]}
					yAxisBeginAtZero={true}
				/>
			</div>
		{/snippet}
	</SectionCard>

	<!-- Reps per Session -->
	<SectionCard title="Reps per Session">
		{#snippet children()}
			<div class="h-[300px]">
				<BarChart
					labels={data.chartLabels}
					datasets={[
						{
							label: 'Reps',
							data: data.repsData,
							backgroundColor: 'rgba(255, 152, 0, 0.4)',
							borderColor: '#ff9800'
						}
					]}
					yAxisBeginAtZero={true}
				/>
			</div>
		{/snippet}
	</SectionCard>

	<!-- Session History -->
	<SectionCard title="Session History">
		{#snippet children()}
			<DataTable>
				<thead>
					<tr>
						<th>Date</th>
						<th>Duration</th>
						<th>Volume</th>
						<th>Sets</th>
						<th>Reps</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each [...data.sessions].reverse() as session}
						<tr>
							<td>{formatDate(session.start_time)}</td>
							<td>
								{session.duration_seconds != null
									? formatDuration(session.duration_seconds)
									: '—'}
							</td>
							<td>{formatVolume(session.totalVolume)}</td>
							<td>{session.totalSets}</td>
							<td>{session.totalReps}</td>
							<td>
								<a
									href="/workouts/{session.uuid}"
									class="flex items-center gap-1 text-sm text-primary-500 hover:underline whitespace-nowrap"
								>
									View Workout
									<ExternalLink class="w-3.5 h-3.5" />
								</a>
							</td>
						</tr>
					{/each}
				</tbody>
			</DataTable>
		{/snippet}
	</SectionCard>
</div>
