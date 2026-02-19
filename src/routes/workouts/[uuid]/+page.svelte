<script lang="ts">
	import { PageHeader, StatCard, SectionCard, DataTable, Badge } from '$lib';
	import { formatDate, formatDuration, slugify } from '$lib/utils/format';
	import { ArrowLeft, Calendar, Clock, Dumbbell } from 'lucide-svelte';

	let { data } = $props();
	const workout = $derived(data.workout);

	// Map set type to badge variant
	const getBadgeVariant = (setType: string): 'default' | 'error' | 'warning' => {
		if (setType === 'failure') return 'error';
		if (setType === 'warmup') return 'warning';
		return 'default';
	};
</script>

<PageHeader title={workout.title}>
	{#snippet actions()}
		<a href="/workouts" class="flex items-center gap-2 text-surface-600-400 hover:text-surface-900-100">
			<ArrowLeft class="w-4 h-4" />
			<span class="text-sm">Back to Workouts</span>
		</a>
	{/snippet}
</PageHeader>

<div class="p-6 space-y-6">
	<!-- Workout Info Stats -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
		<StatCard title="Date" value={formatDate(workout.start_time).split(',')[0]} class="!p-4">
			{#snippet icon()}
				<Calendar class="w-6 h-6" />
			{/snippet}
		</StatCard>

		<StatCard title="Duration" value={formatDuration(workout.duration_seconds)} class="!p-4">
			{#snippet icon()}
				<Clock class="w-6 h-6" />
			{/snippet}
		</StatCard>

		<StatCard title="Exercises" value={workout.exercises.length} class="!p-4">
			{#snippet icon()}
				<Dumbbell class="w-6 h-6" />
			{/snippet}
		</StatCard>
	</div>

	<!-- Exercises -->
	{#each workout.exercises as exercise}
		<SectionCard title={exercise.exercise_title}>
			{#snippet headerAction()}
				<a
					href="/exercises/{slugify(exercise.exercise_title)}"
					class="text-sm text-primary-500 hover:underline"
				>
					View Progress
				</a>
			{/snippet}

			{#snippet children()}
				{#if exercise.exercise_notes}
					<p class="text-sm text-surface-600-400 mb-4 italic">
						Note: {exercise.exercise_notes}
					</p>
				{/if}

				<DataTable>
					<thead>
						<tr>
							<th>Set</th>
							<th>Type</th>
							<th>Weight (kg)</th>
							<th>Reps</th>
							<th>RPE</th>
						</tr>
					</thead>
					<tbody>
						{#each exercise.sets as set}
							<tr>
								<td>{+set.set_index + 1}</td>
								<td>
									<Badge label={set.set_type} variant={getBadgeVariant(set.set_type)} />
								</td>
								<td>{set.weight_kg}</td>
								<td>{set.reps}</td>
								<td>{set.rpe != null ? set.rpe : '—'}</td>
							</tr>
						{/each}
					</tbody>
				</DataTable>
			{/snippet}
		</SectionCard>
	{/each}
</div>

