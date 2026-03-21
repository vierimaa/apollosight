<script lang="ts">
	import { Calendar } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	let {
		minDate,
		maxDate,
		startDate = $bindable(''),
		endDate = $bindable(''),
		trailing
	}: {
		minDate: string;
		maxDate: string;
		startDate: string;
		endDate: string;
		trailing?: Snippet;
	} = $props();

	const defaultStart = $derived.by(() => {
		if (!maxDate) return minDate;
		const twoWeeks = new Date(new Date(maxDate).getTime() - 13 * 86_400_000)
			.toISOString()
			.slice(0, 10);
		return twoWeeks > minDate ? twoWeeks : minDate;
	});

	$effect(() => {
		endDate = maxDate;
		startDate = defaultStart;
	});
</script>

<div class="preset-filled-surface-100-900 rounded-lg p-4 shadow-sm flex flex-wrap items-center gap-4">
	<div class="flex items-center gap-2 text-surface-600-400">
		<Calendar class="w-4 h-4" />
		<span class="text-sm font-medium">Date range</span>
	</div>
	<div class="flex flex-wrap items-center gap-3">
		<div class="flex items-center gap-2">
			<label for="start-date" class="text-sm text-surface-600-400">From</label>
			<input
				id="start-date"
				type="date"
				min={minDate}
				max={endDate}
				value={startDate}
				oninput={(event) => {
					startDate = (event.currentTarget as HTMLInputElement).value;
				}}
				class="px-3 py-1.5 rounded-lg border border-surface-300-700 bg-surface-50-950
					text-surface-950-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
			/>
		</div>
		<div class="flex items-center gap-2">
			<label for="end-date" class="text-sm text-surface-600-400">To</label>
			<input
				id="end-date"
				type="date"
				min={startDate}
				max={maxDate}
				value={endDate}
				oninput={(event) => {
					endDate = (event.currentTarget as HTMLInputElement).value;
				}}
				class="px-3 py-1.5 rounded-lg border border-surface-300-700 bg-surface-50-950
					text-surface-950-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
			/>
		</div>
		{#if startDate !== defaultStart || endDate !== maxDate}
			<button
				onclick={() => {
					endDate = maxDate;
					startDate = defaultStart;
				}}
				class="text-sm text-primary-500 hover:text-primary-400 transition-colors"
			>
				Reset
			</button>
		{/if}
	</div>
	{#if trailing}
		{@render trailing()}
	{/if}
</div>
