<script lang="ts">
	import { PageHeader, SectionCard, EmptyState, StatCard } from '$lib';
	import { slugify } from '$lib/utils/format';
	import { Search, Dumbbell } from 'lucide-svelte';

	const { data } = $props();

	let filter = $state('');
	let sortMode = $state<'alpha' | 'recent'>('recent');

	const formatRelativeDate = (iso: string): string => {
		const diffDays = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
		if (diffDays === 0) return 'Today';
		if (diffDays === 1) return 'Yesterday';
		if (diffDays < 7) return `${diffDays} days ago`;
		if (diffDays < 14) return '1 week ago';
		if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
		if (diffDays < 60) return '1 month ago';
		return `${Math.floor(diffDays / 30)} months ago`;
	};

	const sortedExercises = $derived(
		sortMode === 'recent'
			? [...data.exercises].sort(
					(exerciseA, exerciseB) =>
						new Date(exerciseB.lastDate).getTime() - new Date(exerciseA.lastDate).getTime()
				)
			: [...data.exercises]
	);

	const filteredExercises = $derived(
		sortedExercises.filter((exercise) =>
			exercise.title.toLowerCase().includes(filter.trim().toLowerCase())
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
			<div class="flex items-center gap-3">
				<div class="flex gap-2">
					<button
						onclick={() => (sortMode = 'alpha')}
						class="px-3 py-1.5 text-sm rounded-lg transition-colors
							{sortMode === 'alpha'
							? 'bg-primary-500 text-white'
							: 'bg-surface-200-800 text-surface-700-300 hover:bg-surface-300-700'}"
					>
						A-Z
					</button>
					<button
						onclick={() => (sortMode = 'recent')}
						class="px-3 py-1.5 text-sm rounded-lg transition-colors
							{sortMode === 'recent'
							? 'bg-primary-500 text-white'
							: 'bg-surface-200-800 text-surface-700-300 hover:bg-surface-300-700'}"
					>
						Recent
					</button>
				</div>
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
			</div>
		{/snippet}

		{#snippet children()}
		{#if filteredExercises.length === 0}
			<EmptyState message="No exercises found matching your search.">
				{#snippet icon()}
					<Search class="w-12 h-12" />
				{/snippet}
			</EmptyState>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
				{#each filteredExercises as exercise}
						<a
							href="/exercises/{slugify(exercise.title)}"
							class="preset-filled-surface-200-800 rounded-lg p-4 hover:preset-tonal-primary transition-all
								flex items-center gap-3 group"
						>
							<Dumbbell class="w-5 h-5 shrink-0 text-surface-600-400 group-hover:text-primary-500" />
							<div class="flex-1 min-w-0">
								<span class="font-medium text-surface-900-100 group-hover:text-primary-500 block truncate">
									{exercise.title}
								</span>
								<div class="flex items-center gap-3 mt-1">
									<span class="text-xs text-surface-500-400">
										{exercise.sessionCount} session{exercise.sessionCount === 1 ? '' : 's'}
									</span>
									<span class="text-xs text-surface-500-400">
										{formatRelativeDate(exercise.lastDate)}
									</span>
								</div>
							</div>
						</a>
					{/each}
				</div>
			{/if}
		{/snippet}
	</SectionCard>
</div>

