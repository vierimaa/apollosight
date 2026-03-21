<script lang="ts">
	import { PageHeader, StatCard, SectionCard, BarChart, EmptyState } from '$lib';
	import { Flame, Beef, Wheat, Droplets, Calendar, Activity } from 'lucide-svelte';
	import type { NutritionEntry } from '$lib';

	const { data } = $props();

	const fmtKcal = (kcal: number) => `${Math.round(kcal).toLocaleString('fi-FI')} kcal`;
	const fmtGrams = (g: number) => `${Math.round(g)} g`;

	// Bounds derived from server data (never change after SSR)
	const minDate = $derived(data.entries[0]?.date ?? '');
	const maxDate = $derived(data.entries[data.entries.length - 1]?.date ?? '');

	// User-controlled date range — default to past 2 weeks, initialized once on mount via $effect
	let startDate = $state('');
	let endDate = $state('');

	$effect(() => {
		endDate = maxDate;
		// Default start to 2 weeks before the latest entry date (or the earliest available if sooner).
		const twoWeeksBeforeMax = maxDate
			? new Date(new Date(maxDate).getTime() - 13 * 86_400_000).toISOString().slice(0, 10)
			: minDate;
		startDate = twoWeeksBeforeMax > minDate ? twoWeeksBeforeMax : minDate;
	});

	const filteredEntries = $derived(
		!startDate && !endDate
			? data.entries
			: data.entries.filter(
					(entry: NutritionEntry) =>
						(!startDate || entry.date >= startDate) && (!endDate || entry.date <= endDate)
				)
	);

	// --- Averages over filtered range ---

	const filteredTotalDays = $derived(filteredEntries.length);

	const filteredAvgCalories = $derived(
		filteredTotalDays > 0
			? Math.round(
					filteredEntries.reduce((sum: number, e: NutritionEntry) => sum + e.calories, 0) /
						filteredTotalDays
				)
			: 0
	);

	const filteredAvgProtein = $derived(
		filteredTotalDays > 0
			? Math.round(
					filteredEntries.reduce((sum: number, e: NutritionEntry) => sum + e.protein_g, 0) /
						filteredTotalDays
				)
			: 0
	);

	const filteredAvgCarbs = $derived(
		filteredTotalDays > 0
			? Math.round(
					filteredEntries.reduce((sum: number, e: NutritionEntry) => sum + e.carbohydrate_g, 0) /
						filteredTotalDays
				)
			: 0
	);

	const filteredAvgFat = $derived(
		filteredTotalDays > 0
			? Math.round(
					filteredEntries.reduce((sum: number, e: NutritionEntry) => sum + e.fat_g, 0) /
						filteredTotalDays
				)
			: 0
	);

	// --- Macro % of total calories (protein/carbs = 4 kcal/g, fat = 9 kcal/g) ---

	const macroKcals = $derived({
		protein: filteredAvgProtein * 4,
		carbs: filteredAvgCarbs * 4,
		fat: filteredAvgFat * 9
	});

	const macroKcalTotal = $derived(macroKcals.protein + macroKcals.carbs + macroKcals.fat);

	const macroPct = $derived(
		macroKcalTotal > 0
			? {
					protein: Math.round((macroKcals.protein / macroKcalTotal) * 100),
					carbs: Math.round((macroKcals.carbs / macroKcalTotal) * 100),
					fat: Math.round((macroKcals.fat / macroKcalTotal) * 100)
				}
			: { protein: 0, carbs: 0, fat: 0 }
	);

	// --- Highest / lowest calorie days ---

	const maxCalorieEntry = $derived(
		filteredEntries.length > 0
			? filteredEntries.reduce((best: NutritionEntry, entry: NutritionEntry) =>
					entry.calories > best.calories ? entry : best
				)
			: null
	);

	const minCalorieEntry = $derived(
		filteredEntries.length > 0
			? filteredEntries.reduce((best: NutritionEntry, entry: NutritionEntry) =>
					entry.calories < best.calories ? entry : best
				)
			: null
	);

	// --- Chart data ---

	const chartLabels = $derived(
		filteredEntries.map((entry: NutritionEntry) =>
			new Date(entry.date).toLocaleDateString('fi-FI', { day: 'numeric', month: 'short' })
		)
	);

	const macroDatasets = $derived([
		{
			label: 'Protein (g)',
			data: filteredEntries.map((entry: NutritionEntry) => entry.protein_g),
			backgroundColor: 'rgba(99, 102, 241, 0.85)',
			borderColor: 'rgb(99, 102, 241)'
		},
		{
			label: 'Carbohydrates (g)',
			data: filteredEntries.map((entry: NutritionEntry) => entry.carbohydrate_g),
			backgroundColor: 'rgba(234, 179, 8, 0.85)',
			borderColor: 'rgb(234, 179, 8)'
		},
		{
			label: 'Fat (g)',
			data: filteredEntries.map((entry: NutritionEntry) => entry.fat_g),
			backgroundColor: 'rgba(34, 197, 94, 0.85)',
			borderColor: 'rgb(34, 197, 94)'
		}
	]);

	/**
	 * Macros converted to kcal contributions (protein/carbs = 4 kcal/g, fat = 9 kcal/g)
	 * so the stacked bar height equals total macro-attributed calories.
	 */
	const stackedMacroDatasets = $derived([
		{
			label: 'Protein',
			data: filteredEntries.map((entry: NutritionEntry) => Math.round(entry.protein_g * 4)),
			backgroundColor: 'rgba(99, 102, 241, 0.85)',
			borderColor: 'rgb(99, 102, 241)'
		},
		{
			label: 'Carbohydrates',
			data: filteredEntries.map((entry: NutritionEntry) => Math.round(entry.carbohydrate_g * 4)),
			backgroundColor: 'rgba(234, 179, 8, 0.85)',
			borderColor: 'rgb(234, 179, 8)'
		},
		{
			label: 'Fat',
			data: filteredEntries.map((entry: NutritionEntry) => Math.round(entry.fat_g * 9)),
			backgroundColor: 'rgba(34, 197, 94, 0.85)',
			borderColor: 'rgb(34, 197, 94)'
		}
	]);
</script>

<PageHeader title="Nutrition" />

<div class="p-6 space-y-6">
	{#if data.entries.length === 0}
		<EmptyState message="No nutrition entries found. Log your meals in FatSecret to see data here.">
			{#snippet icon()}
				<Flame class="w-12 h-12" />
			{/snippet}
		</EmptyState>
	{:else}
		<!-- Date Range Picker -->
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
				{#if startDate !== minDate || endDate !== maxDate}
					<button
						onclick={() => {
							endDate = maxDate;
							const twoWeeksBeforeMax = maxDate
								? new Date(new Date(maxDate).getTime() - 13 * 86_400_000).toISOString().slice(0, 10)
								: minDate;
							startDate = twoWeeksBeforeMax > minDate ? twoWeeksBeforeMax : minDate;
						}}
						class="text-sm text-primary-500 hover:text-primary-400 transition-colors"
					>
						Reset
					</button>
				{/if}
			</div>
			<span class="text-sm text-surface-500-400 ml-auto">
				{filteredTotalDays}
				{filteredTotalDays === 1 ? 'day' : 'days'} tracked
			</span>
		</div>

		{#if filteredEntries.length === 0}
			<EmptyState message="No nutrition entries in the selected date range.">
				{#snippet icon()}
					<Calendar class="w-12 h-12" />
				{/snippet}
			</EmptyState>
		{:else}
			<!-- Stat Cards: Avg calories + macros -->
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<StatCard title="Avg Daily Calories" value={fmtKcal(filteredAvgCalories)}>
					{#snippet icon()}
						<Flame class="w-8 h-8" />
					{/snippet}
				</StatCard>

				<StatCard title="Avg Protein" value={fmtGrams(filteredAvgProtein)}>
					{#snippet icon()}
						<Beef class="w-8 h-8" />
					{/snippet}
				</StatCard>

				<StatCard title="Avg Carbohydrates" value={fmtGrams(filteredAvgCarbs)}>
					{#snippet icon()}
						<Wheat class="w-8 h-8" />
					{/snippet}
				</StatCard>

				<StatCard title="Avg Fat" value={fmtGrams(filteredAvgFat)}>
					{#snippet icon()}
						<Droplets class="w-8 h-8" />
					{/snippet}
				</StatCard>
			</div>

			<!-- Secondary stats row: Macro % + calorie extremes -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<!-- Macro distribution card -->
				<div class="preset-filled-surface-100-900 rounded-lg p-6 shadow-sm md:col-span-2">
					<p class="text-sm font-medium text-surface-600-400 mb-4">Macro Distribution (avg)</p>
					<div class="space-y-3">
						<!-- Protein bar -->
						<div>
							<div class="flex items-center justify-between mb-1">
								<span class="text-sm font-medium text-surface-700-300">Protein</span>
								<span class="text-sm font-bold text-indigo-400">{macroPct.protein}%</span>
							</div>
							<div class="h-2.5 rounded-full bg-surface-300-700 overflow-hidden">
								<div
									class="h-full rounded-full bg-indigo-500 transition-[width] duration-500"
									style="width: {macroPct.protein}%"
								></div>
							</div>
							<p class="text-xs text-surface-500-400 mt-0.5">{filteredAvgProtein} g · {macroKcals.protein} kcal</p>
						</div>
						<!-- Carbs bar -->
						<div>
							<div class="flex items-center justify-between mb-1">
								<span class="text-sm font-medium text-surface-700-300">Carbohydrates</span>
								<span class="text-sm font-bold text-yellow-400">{macroPct.carbs}%</span>
							</div>
							<div class="h-2.5 rounded-full bg-surface-300-700 overflow-hidden">
								<div
									class="h-full rounded-full bg-yellow-500 transition-[width] duration-500"
									style="width: {macroPct.carbs}%"
								></div>
							</div>
							<p class="text-xs text-surface-500-400 mt-0.5">{filteredAvgCarbs} g · {macroKcals.carbs} kcal</p>
						</div>
						<!-- Fat bar -->
						<div>
							<div class="flex items-center justify-between mb-1">
								<span class="text-sm font-medium text-surface-700-300">Fat</span>
								<span class="text-sm font-bold text-emerald-400">{macroPct.fat}%</span>
							</div>
							<div class="h-2.5 rounded-full bg-surface-300-700 overflow-hidden">
								<div
									class="h-full rounded-full bg-emerald-500 transition-[width] duration-500"
									style="width: {macroPct.fat}%"
								></div>
							</div>
							<p class="text-xs text-surface-500-400 mt-0.5">{filteredAvgFat} g · {macroKcals.fat} kcal</p>
						</div>
					</div>
				</div>

				<!-- Calorie extremes -->
				<div class="preset-filled-surface-100-900 rounded-lg p-6 shadow-sm">
					<p class="text-sm font-medium text-surface-600-400 mb-4">
						<Activity class="w-4 h-4 inline mr-1 -mt-0.5" />Calorie Range
					</p>
					<div class="space-y-4">
						<div>
							<p class="text-xs text-surface-500-400 uppercase tracking-wide mb-1">Highest day</p>
							{#if maxCalorieEntry}
								<p class="text-2xl font-bold text-surface-950-50">
									{fmtKcal(maxCalorieEntry.calories)}
								</p>
								<p class="text-xs text-surface-500-400 mt-0.5">
									{new Date(maxCalorieEntry.date).toLocaleDateString('fi-FI', {
										day: 'numeric',
										month: 'short',
										year: 'numeric'
									})}
								</p>
							{/if}
						</div>
						<div class="border-t border-surface-300-700"></div>
						<div>
							<p class="text-xs text-surface-500-400 uppercase tracking-wide mb-1">Lowest day</p>
							{#if minCalorieEntry}
								<p class="text-2xl font-bold text-surface-950-50">
									{fmtKcal(minCalorieEntry.calories)}
								</p>
								<p class="text-xs text-surface-500-400 mt-0.5">
									{new Date(minCalorieEntry.date).toLocaleDateString('fi-FI', {
										day: 'numeric',
										month: 'short',
										year: 'numeric'
									})}
								</p>
							{/if}
						</div>
					</div>
				</div>
			</div>

			<!-- Combined stacked calorie + macro chart -->
			<SectionCard title="Daily Calories by Macro">
				<BarChart
					labels={chartLabels}
					datasets={stackedMacroDatasets}
					stacked={true}
					tooltipUnit="kcal"
					showTooltipTotal={true}
					class="h-72"
				/>
			</SectionCard>

			<!-- Macro grams chart -->
			<SectionCard title="Daily Macros (g)">
				<BarChart
					labels={chartLabels}
					datasets={macroDatasets}
					tooltipUnit="g"
					class="h-72"
				/>
			</SectionCard>
		{/if}
	{/if}
</div>
