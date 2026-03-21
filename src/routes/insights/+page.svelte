<script lang="ts">
	import { PageHeader, StatCard, SectionCard, LineChart, EmptyState, DateRangePicker } from '$lib';
	import { TrendingUp, TrendingDown, Minus, Flame, Beef, Calendar, Scale } from 'lucide-svelte';
	import type { CombinedDayEntry } from '$lib';

	const { data } = $props();

	const fmtKg = (kg: number) => `${kg.toFixed(1)} kg`;
	const fmtKcal = (kcal: number) => `${Math.round(kcal).toLocaleString('fi-FI')} kcal`;
	const fmtGrams = (g: number) => `${Math.round(g)} g`;

	// Bounds derived from server data (stable after SSR)
	const minDate = $derived(data.entries[0]?.date ?? '');
	const maxDate = $derived(data.entries[data.entries.length - 1]?.date ?? '');

	// User-controlled date range — initialized by DateRangePicker on mount
	let startDate = $state('');
	let endDate = $state('');

	const filteredEntries = $derived(
		!startDate && !endDate
			? data.entries
			: data.entries.filter(
					(entry: CombinedDayEntry) =>
						(!startDate || entry.date >= startDate) && (!endDate || entry.date <= endDate)
				)
	);

	// Subsets for targeted calculations
	const weightEntries = $derived(
		filteredEntries.filter((entry: CombinedDayEntry) => entry.weight_kg !== undefined)
	);

	const nutritionEntries = $derived(
		filteredEntries.filter((entry: CombinedDayEntry) => entry.calories !== undefined)
	);

	const overlappingDays = $derived(
		filteredEntries.filter(
			(entry: CombinedDayEntry) =>
				entry.weight_kg !== undefined && entry.calories !== undefined
		).length
	);

	// Weekly rate of weight change — same formula as weight page
	const weeklyRate = $derived.by((): number | null => {
		if (weightEntries.length < 2) return null;
		const first = weightEntries[0];
		const last = weightEntries[weightEntries.length - 1];
		const daySpan = last.date_int - first.date_int;
		if (daySpan < 1) return null;
		return ((last.weight_kg! - first.weight_kg!) / daySpan) * 7;
	});

	const weightChange = $derived(
		weightEntries.length >= 2
			? weightEntries[weightEntries.length - 1].weight_kg! - weightEntries[0].weight_kg!
			: null
	);

	const avgCalories = $derived(
		nutritionEntries.length > 0
			? Math.round(
					nutritionEntries.reduce(
						(sum: number, e: CombinedDayEntry) => sum + (e.calories ?? 0),
						0
					) / nutritionEntries.length
				)
			: null
	);

	const avgProtein = $derived(
		nutritionEntries.length > 0
			? Math.round(
					nutritionEntries.reduce(
						(sum: number, e: CombinedDayEntry) => sum + (e.protein_g ?? 0),
						0
					) / nutritionEntries.length
				)
			: null
	);

	// Phase — requires ≥3 weight entries and a calculable rate
	type Phase = 'cutting' | 'maintaining' | 'bulking' | 'insufficient-data';

	const phase = $derived.by((): Phase => {
		if (weightEntries.length < 3 || weeklyRate === null) return 'insufficient-data';
		if (weeklyRate < -0.1) return 'cutting';
		if (weeklyRate > 0.1) return 'bulking';
		return 'maintaining';
	});

	// Chart data — same x-axis for both charts (all days in filtered range)
	const chartLabels = $derived(
		filteredEntries.map((entry: CombinedDayEntry) =>
			new Date(entry.date).toLocaleDateString('fi-FI', { day: 'numeric', month: 'short' })
		)
	);

	const weightDataset = $derived([
		{
			label: 'Weight (kg)',
			data: filteredEntries.map((entry: CombinedDayEntry) => entry.weight_kg ?? null),
			borderColor: 'rgb(99, 102, 241)',
			backgroundColor: 'rgba(99, 102, 241, 0.1)',
			spanGaps: true
		}
	]);

	const caloriesDataset = $derived([
		{
			label: 'Calories (kcal)',
			data: filteredEntries.map((entry: CombinedDayEntry) => entry.calories ?? null),
			borderColor: 'rgb(249, 115, 22)',
			backgroundColor: 'rgba(249, 115, 22, 0.1)',
			spanGaps: true
		}
	]);
</script>

<PageHeader title="Insights" />

<div class="p-6 space-y-6">
	{#if data.entries.length === 0}
		<EmptyState
			message="No data found. Log your weight and meals in FatSecret to see insights here."
		>
			{#snippet icon()}
				<TrendingUp class="w-12 h-12" />
			{/snippet}
		</EmptyState>
	{:else}
		<!-- Date Range Picker -->
		<DateRangePicker {minDate} {maxDate} bind:startDate bind:endDate>
			{#snippet trailing()}
				<span class="text-sm text-surface-500-400 ml-auto">
					{filteredEntries.length}
					{filteredEntries.length === 1 ? 'day' : 'days'} tracked
				</span>
			{/snippet}
		</DateRangePicker>

		{#if filteredEntries.length === 0}
			<EmptyState message="No entries in the selected date range.">
				{#snippet icon()}
					<Calendar class="w-12 h-12" />
				{/snippet}
			</EmptyState>
		{:else}
			<!-- Stat Cards -->
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<StatCard
					title="Weight Change"
					value={weightChange !== null
						? (weightChange >= 0 ? '+' : '') + fmtKg(weightChange)
						: '—'}
				>
					{#snippet icon()}
						{#if weightChange === null || Math.abs(weightChange) < 0.05}
							<Minus class="w-8 h-8" />
						{:else if weightChange > 0}
							<TrendingUp class="w-8 h-8" />
						{:else}
							<TrendingDown class="w-8 h-8" />
						{/if}
					{/snippet}
				</StatCard>

				<StatCard
					title="Avg Daily Calories"
					value={avgCalories !== null ? fmtKcal(avgCalories) : '—'}
				>
					{#snippet icon()}
						<Flame class="w-8 h-8" />
					{/snippet}
				</StatCard>

				<StatCard title="Avg Protein" value={avgProtein !== null ? fmtGrams(avgProtein) : '—'}>
					{#snippet icon()}
						<Beef class="w-8 h-8" />
					{/snippet}
				</StatCard>

				<StatCard
					title="Rate of Change"
					value={weeklyRate !== null
						? (weeklyRate >= 0 ? '+' : '') + weeklyRate.toFixed(2) + ' kg/wk'
						: '—'}
				>
					{#snippet icon()}
						{#if weeklyRate === null || Math.abs(weeklyRate) < 0.1}
							<Minus class="w-8 h-8" />
						{:else if weeklyRate > 0}
							<TrendingUp class="w-8 h-8" />
						{:else}
							<TrendingDown class="w-8 h-8" />
						{/if}
					{/snippet}
				</StatCard>
			</div>

			<!-- Phase Card -->
			<div class="preset-filled-surface-100-900 rounded-lg p-6 shadow-sm">
				<div class="flex items-start gap-4">
					<div class="flex-1">
						<p class="text-sm font-medium text-surface-600-400 mb-2">Current Phase</p>
						{#if phase === 'cutting'}
							<span
								class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 mb-2"
							>
								Cutting
							</span>
							<p class="text-sm text-surface-700-300">
								You're in a <strong>calorie deficit</strong> — losing ~{Math.abs(weeklyRate!).toFixed(
									2
								)} kg/week at avg {fmtKcal(avgCalories!)}.
							</p>
						{:else if phase === 'maintaining'}
							<span
								class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 mb-2"
							>
								Maintaining
							</span>
							<p class="text-sm text-surface-700-300">
								Your weight is <strong>stable</strong> — avg {fmtKcal(avgCalories!)} is approximately
								your maintenance intake.
							</p>
						{:else if phase === 'bulking'}
							<span
								class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 mb-2"
							>
								Bulking
							</span>
							<p class="text-sm text-surface-700-300">
								You're in a <strong>calorie surplus</strong> — gaining ~{weeklyRate!.toFixed(2)} kg/week
								at avg {fmtKcal(avgCalories!)}.
							</p>
						{:else}
							<span
								class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-300/20 text-surface-500-400 mb-2"
							>
								Insufficient data
							</span>
							<p class="text-sm text-surface-700-300">
								Not enough weight data in this period. Log at least 3 weight entries to detect your
								phase.
							</p>
						{/if}
					</div>
					<Scale class="w-8 h-8 text-surface-500-400 shrink-0" />
				</div>
			</div>

			<!-- Weight Trend Chart -->
			<SectionCard title="Weight Trend">
				<div class="h-52">
					<LineChart
						labels={chartLabels}
						datasets={weightDataset}
						yAxisBeginAtZero={false}
					/>
				</div>
			</SectionCard>

			<!-- Daily Calories Chart -->
			<SectionCard title="Daily Calories">
				<div class="h-52">
					<LineChart
						labels={chartLabels}
						datasets={caloriesDataset}
						yAxisBeginAtZero={false}
					/>
				</div>
			</SectionCard>
		{/if}
	{/if}
</div>
