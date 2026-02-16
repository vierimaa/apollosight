<script lang="ts">
	import { PageHeader, SectionCard, EmptyState, StatCard } from '$lib';
	import { Search, Dumbbell } from 'lucide-svelte';

	const { data } = $props();

	// Helper to create a slug from the exercise title
	function slugify(title: string) {
		return title.replace(/\s+/g, '-').toLowerCase();
	}

	let filter = $state('');

	const filteredExercises = $derived(() =>
		data.exercises.filter((exercise) =>
			exercise.toLowerCase().includes(filter.trim().toLowerCase())
		)
	);
</script>

<PageHeader title="Exercises">
	{#snippet actions()}
		<StatCard title="Total" value={data.exercises.length} class="!p-3 !shadow-none">
			{#snippet icon()}
				<Dumbbell class="w-5 h-5" />
			{/snippet}
		</StatCard>
	{/snippet}
</PageHeader>

<div class="p-6 space-y-6">
	<SectionCard title="Exercise Library">
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
			{#if filteredExercises().length === 0}
				<EmptyState message="No exercises found matching your search.">
					{#snippet icon()}
						<Search class="w-12 h-12" />
					{/snippet}
				</EmptyState>
			{:else}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
					{#each filteredExercises() as exercise}
						<a
							href="/exercises/{slugify(exercise)}"
							class="preset-filled-surface-200-800 rounded-lg p-4 hover:preset-tonal-primary transition-all
								flex items-center gap-3 group"
						>
							<Dumbbell class="w-5 h-5 text-surface-600-400 group-hover:text-primary-500" />
							<span class="font-medium text-surface-900-100 group-hover:text-primary-500">
								{exercise}
							</span>
						</a>
					{/each}
				</div>
			{/if}
		{/snippet}
	</SectionCard>
</div>

