<script lang="ts">
	import { PageHeader, SectionCard, StatCard, DataTable, EmptyState } from '$lib';
	import { formatDate, formatVolume } from '$lib/utils/format';
	import { Trophy, Dumbbell, Search } from 'lucide-svelte';

	const { data } = $props();

	let filter = $state('');

	const filteredPRs = $derived(
		filter.trim() === ''
			? data.exercisePRs
			: data.exercisePRs.filter((pr) =>
					pr.title.toLowerCase().includes(filter.trim().toLowerCase())
				)
	);
</script>

<PageHeader title="Personal Records">
	{#snippet actions()}
		<StatCard title="Exercises Tracked" value={data.totalExercises} class="!p-3 !shadow-none">
			{#snippet icon()}
				<div class="ml-3">
					<Trophy class="w-5 h-5" />
				</div>
			{/snippet}
		</StatCard>
	{/snippet}
</PageHeader>

<div class="p-6">
	<SectionCard title="All-time Personal Records" subtitle="Best result ever recorded per exercise, sorted by most recently trained">
		{#snippet headerAction()}
			<div class="relative">
				<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500-400" />
				<input
					type="text"
					placeholder="Search exercises..."
					value={filter}
					oninput={(e) => {
						filter = (e.currentTarget as HTMLInputElement).value;
					}}
					class="pl-10 pr-4 py-2 rounded-lg border border-surface-300-700 bg-surface-50-950 text-surface-950-50
						focus:outline-none focus:ring-2 focus:ring-primary-500 w-64"
				/>
			</div>
		{/snippet}

		{#snippet children()}
			{#if filteredPRs.length === 0}
				<EmptyState message="No workout data found. Complete some workouts to see your personal records.">
					{#snippet icon()}
						<Dumbbell class="w-12 h-12" />
					{/snippet}
				</EmptyState>
			{:else}
				<DataTable>
					{#snippet children()}
						<thead>
							<tr>
								<th>Exercise</th>
								<th>Best 1RM</th>
								<th>Heaviest Weight</th>
								<th>Most Reps</th>
								<th>Best Volume</th>
								<th>Sessions</th>
							</tr>
						</thead>
						<tbody>
							{#each filteredPRs as pr}
								<tr>
									<td>
										<a
											href="/exercises/{pr.slug}"
											class="font-medium text-primary-600 hover:text-primary-500 hover:underline transition-colors"
										>
											{pr.title}
										</a>
									</td>
									<td>
										<span class="font-semibold">{formatVolume(pr.bestOneRM.value)}</span>
										<br />
										<span class="text-xs text-surface-500-400">{formatDate(pr.bestOneRM.date)}</span>
									</td>
									<td>
										<span class="font-semibold">{formatVolume(pr.heaviestWeight.value)}</span>
										<br />
										<span class="text-xs text-surface-500-400">{formatDate(pr.heaviestWeight.date)}</span>
									</td>
									<td>
										<span class="font-semibold">{pr.mostReps.value}</span>
										<br />
										<span class="text-xs text-surface-500-400">{formatDate(pr.mostReps.date)}</span>
									</td>
									<td>
										<span class="font-semibold">{formatVolume(pr.bestVolume.value)}</span>
										<br />
										<span class="text-xs text-surface-500-400">{formatDate(pr.bestVolume.date)}</span>
									</td>
									<td>
										<span class="font-semibold">{pr.totalSessions}</span>
									</td>
								</tr>
							{/each}
						</tbody>
					{/snippet}
				</DataTable>
			{/if}
		{/snippet}
	</SectionCard>
</div>
