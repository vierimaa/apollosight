<script lang="ts">
	import { PageHeader, SectionCard, EmptyState, StatCard } from '$lib';
	import { formatDuration } from '$lib/utils/format';
	import { Search, Layers, Calendar, Clock } from 'lucide-svelte';

	const { data } = $props();

	let filter = $state('');
	let sortMode = $state<'recent' | 'alpha'>('recent');

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

	const sortedPrograms = $derived(
		sortMode === 'alpha'
			? [...data.programs].sort((programA, programB) =>
					programA.title.localeCompare(programB.title)
				)
			: [...data.programs]
	);

	const filteredPrograms = $derived(
		sortedPrograms.filter((program) =>
			program.title.toLowerCase().includes(filter.trim().toLowerCase())
		)
	);
</script>

<PageHeader title="Programs">
	{#snippet actions()}
		<StatCard title="Total" value={data.programs.length} class="!p-3 !shadow-none">
			{#snippet icon()}
				<Layers class="w-5 h-5" />
			{/snippet}
		</StatCard>
	{/snippet}
</PageHeader>

<div class="p-6 space-y-6">
	<SectionCard title="Workout Programs">
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
						placeholder="Search programs..."
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
			{#if filteredPrograms.length === 0}
				<EmptyState message="No programs found matching your search.">
					{#snippet icon()}
						<Search class="w-12 h-12" />
					{/snippet}
				</EmptyState>
			{:else}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
					{#each filteredPrograms as program}
						<a
							href="/programs/{program.slug}"
							class="preset-filled-surface-200-800 rounded-lg p-4 hover:preset-tonal-primary transition-all
								flex items-start gap-3 group"
						>
							<Layers
								class="w-5 h-5 shrink-0 mt-0.5 text-surface-600-400 group-hover:text-primary-500"
							/>
							<div class="flex-1 min-w-0">
								<span
									class="font-medium text-surface-900-100 group-hover:text-primary-500 block truncate"
								>
									{program.title}
								</span>
								<div class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
									<span class="flex items-center gap-1 text-xs text-surface-500-400">
										<Layers class="w-3 h-3" />
										{program.sessionCount} session{program.sessionCount === 1 ? '' : 's'}
									</span>
									{#if program.avgDuration != null}
										<span class="flex items-center gap-1 text-xs text-surface-500-400">
											<Clock class="w-3 h-3" />
											avg {formatDuration(program.avgDuration)}
										</span>
									{/if}
									<span class="flex items-center gap-1 text-xs text-surface-500-400">
										<Calendar class="w-3 h-3" />
										{formatRelativeDate(program.lastDate)}
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
