<script lang="ts">
	import { PageHeader, StatCard, SectionCard, LineChart, EmptyState, DateRangePicker, calcWeeklyRate } from '$lib';
	import { Scale, TrendingDown, TrendingUp, Minus, Calendar, Activity } from 'lucide-svelte';
	import type { WeightEntry } from '$lib';

	const { data } = $props();

	const fmtKg = (kg: number) => `${kg.toFixed(1)} kg`;



	/** Format a weekly rate as "+0.32 kg/wk" */
	const fmtRate = (kgPerWeek: number): string => {
		const sign = kgPerWeek >= 0 ? '+' : '';
		return `${sign}${kgPerWeek.toFixed(2)} kg/wk`;
	};

	// Bounds derived from server data (never change after SSR)
	const minDate = $derived(data.entries[0]?.date ?? '');
	const maxDate = $derived(data.entries[data.entries.length - 1]?.date ?? '');

	// User-controlled date range — initialized by DateRangePicker on mount
	let startDate = $state('');
	let endDate = $state('');

	const filteredEntries = $derived(
		!startDate && !endDate
			? data.entries
			: data.entries.filter(
					(entry: WeightEntry) =>
						(!startDate || entry.date >= startDate) &&
						(!endDate || entry.date <= endDate)
				)
	);

	const currentWeight = $derived(
		filteredEntries.length > 0
			? fmtKg(filteredEntries[filteredEntries.length - 1].weight_kg)
			: '—'
	);

	const minEntry = $derived(
		filteredEntries.length > 0
			? filteredEntries.reduce((best: WeightEntry, entry: WeightEntry) =>
					entry.weight_kg < best.weight_kg ? entry : best
				)
			: null
	);

	const maxEntry = $derived(
		filteredEntries.length > 0
			? filteredEntries.reduce((best: WeightEntry, entry: WeightEntry) =>
					entry.weight_kg > best.weight_kg ? entry : best
				)
			: null
	);

	const changeDelta = $derived(
		filteredEntries.length >= 2
			? filteredEntries[filteredEntries.length - 1].weight_kg - filteredEntries[0].weight_kg
			: null
	);

	const totalChange = $derived(
		changeDelta !== null
			? `${changeDelta >= 0 ? '+' : ''}${changeDelta.toFixed(1)} kg`
			: '—'
	);

	const changeTrend = $derived.by(() => {
		if (changeDelta === null || changeDelta === 0) return undefined;
		return {
			value: Math.abs(changeDelta),
			direction: (changeDelta > 0 ? 'up' : 'down') as 'up' | 'down',
			label: totalChange
		};
	});

	// --- Rate of change ---

	/** Latest date_int from all (unfiltered) entries — used as anchor for last 7d / 30d windows. */
	const latestDateInt = $derived(
		data.entries.length > 0 ? data.entries[data.entries.length - 1].date_int : 0
	);

	const entriesLast7d = $derived(
		data.entries.filter((entry: WeightEntry) => entry.date_int >= latestDateInt - 7)
	);

	const entriesLast30d = $derived(
		data.entries.filter((entry: WeightEntry) => entry.date_int >= latestDateInt - 30)
	);

	const periodRate = $derived(calcWeeklyRate(filteredEntries));
	const rate7d = $derived(calcWeeklyRate(entriesLast7d));
	const rate30d = $derived(calcWeeklyRate(entriesLast30d));

	// --- Chart ---

	const chartLabels = $derived(
		filteredEntries.map((entry: WeightEntry) =>
			new Date(entry.date).toLocaleDateString('fi-FI', { day: 'numeric', month: 'short' })
		)
	);

	const chartDatasets = $derived([
		{
			label: 'Weight (kg)',
			data: filteredEntries.map((entry: WeightEntry) => entry.weight_kg),
			borderColor: 'rgb(99, 102, 241)',
			backgroundColor: 'rgba(99, 102, 241, 0.1)'
		}
	]);
</script>

<PageHeader title="Weight" />

<div class="p-6 space-y-6">
	{#if data.entries.length === 0}
		<EmptyState message="No weight entries found. Log your weight in FatSecret to see data here.">
			{#snippet icon()}
				<Scale class="w-12 h-12" />
			{/snippet}
		</EmptyState>
	{:else}
		<!-- Date Range Picker -->
		<DateRangePicker {minDate} {maxDate} bind:startDate bind:endDate>
			{#snippet trailing()}
				<span class="text-sm text-surface-500-400 ml-auto">
					{filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}
				</span>
			{/snippet}
		</DateRangePicker>

		{#if filteredEntries.length === 0}
			<EmptyState message="No weight entries in the selected date range.">
				{#snippet icon()}
					<Calendar class="w-12 h-12" />
				{/snippet}
			</EmptyState>
		{:else}
			<!-- Stat Cards -->
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<StatCard title="Current Weight" value={currentWeight}>
					{#snippet icon()}
						<Scale class="w-8 h-8" />
					{/snippet}
				</StatCard>

				<StatCard title="Lowest" value={minEntry ? fmtKg(minEntry.weight_kg) : '—'}>
					{#snippet icon()}
						<TrendingDown class="w-8 h-8" />
					{/snippet}
				</StatCard>

				<StatCard title="Highest" value={maxEntry ? fmtKg(maxEntry.weight_kg) : '—'}>
					{#snippet icon()}
						<TrendingUp class="w-8 h-8" />
					{/snippet}
				</StatCard>

				<StatCard
					title="Change ({filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'})"
					value={totalChange}
					trend={changeTrend}
				>
					{#snippet icon()}
						<Minus class="w-8 h-8" />
					{/snippet}
				</StatCard>
			</div>

			<!-- Rate of Change -->
			<SectionCard title="Rate of Change" subtitle="Average kg gained or lost per week">
				{#snippet children()}
					<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4">
						<StatCard
							title="Selected period"
							value={periodRate !== null ? fmtRate(periodRate) : '—'}
						>
							{#snippet icon()}
								<Activity class="w-8 h-8" />
							{/snippet}
						</StatCard>

						<StatCard
							title="Last 7 days"
							value={rate7d !== null ? fmtRate(rate7d) : '—'}
						>
							{#snippet icon()}
								<Activity class="w-8 h-8" />
							{/snippet}
						</StatCard>

						<StatCard
							title="Last 30 days"
							value={rate30d !== null ? fmtRate(rate30d) : '—'}
						>
							{#snippet icon()}
								<Activity class="w-8 h-8" />
							{/snippet}
						</StatCard>
					</div>
				{/snippet}
			</SectionCard>

			<!-- Weight Over Time Chart -->
			<SectionCard title="Weight Over Time" subtitle="Recorded weight entries from FatSecret">
				{#snippet children()}
				<div class="h-90">
					<LineChart
						labels={chartLabels}
						datasets={chartDatasets}
						title="Weight (kg)"
						yAxisBeginAtZero={false}
					/>
				</div>
				{/snippet}
			</SectionCard>
		{/if}
	{/if}
</div>
