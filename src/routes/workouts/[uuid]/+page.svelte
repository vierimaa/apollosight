<script lang="ts">
	import { PageHeader, StatCard, SectionCard, DataTable, Badge } from '$lib';
	import { formatDate, formatDuration, formatVolume, slugify } from '$lib/utils/format';
	import { ArrowLeft, ArrowRight, Calendar, Clock, Dumbbell, Scale } from 'lucide-svelte';

	let { data } = $props();
	const workout = $derived(data.workout);
	const totalVolume = $derived(data.totalVolume);
	const exerciseVolumes = $derived(data.exerciseVolumes);
	const previousWorkout = $derived(data.previousWorkout);
	const nextWorkout = $derived(data.nextWorkout);

	// Map set type to badge variant
	const getBadgeVariant = (setType: string): 'default' | 'error' | 'warning' => {
		if (setType === 'failure') return 'error';
		if (setType === 'warmup') return 'warning';
		return 'default';
	};
</script>

<PageHeader title={workout.title}>
	{#snippet back()}
		<a href="/workouts" class="flex items-center gap-1.5 text-sm text-surface-600-400 hover:text-surface-900-100">
			<ArrowLeft class="w-3.5 h-3.5" />
			Back to Workouts
		</a>
	{/snippet}
	{#snippet actions()}
		{#if previousWorkout}
			<a
				href="/workouts/{previousWorkout.uuid}"
				class="flex items-center gap-1 text-sm text-surface-600-400 hover:text-surface-900-100"
			>
				<ArrowLeft class="w-4 h-4" />
				Previous
			</a>
		{/if}
		{#if nextWorkout}
			<a
				href="/workouts/{nextWorkout.uuid}"
				class="flex items-center gap-1 text-sm text-surface-600-400 hover:text-surface-900-100"
			>
				Next
				<ArrowRight class="w-4 h-4" />
			</a>
		{/if}
	{/snippet}
</PageHeader>

<div class="p-6 space-y-6">
	<!-- Workout Info Stats -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
		<StatCard title="Date" value={formatDate(workout.start_time).split(',')[0]} class="!p-4">
			{#snippet icon()}
				<Calendar class="w-6 h-6" />
			{/snippet}
		</StatCard>

		<StatCard title="Duration" value={formatDuration(workout.duration_seconds ?? 0)} class="!p-4">
			{#snippet icon()}
				<Clock class="w-6 h-6" />
			{/snippet}
		</StatCard>

		<StatCard title="Exercises" value={workout.exercises.length} class="!p-4">
			{#snippet icon()}
				<Dumbbell class="w-6 h-6" />
			{/snippet}
		</StatCard>

		<StatCard title="Volume" value={formatVolume(totalVolume)} class="!p-4">
			{#snippet icon()}
				<Scale class="w-6 h-6" />
			{/snippet}
		</StatCard>
	</div>

	<!-- Exercises -->
	<div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
	{#each workout.exercises as exercise (exercise.exercise_title)}
		<SectionCard
			title={exercise.exercise_title}
			subtitle="{exercise.sets.length} sets · {formatVolume(exerciseVolumes[exercise.exercise_title])} volume"
		>
			{#snippet headerAction()}
				<a
					href="/exercises/{slugify(exercise.exercise_title)}"
					class="text-sm text-primary-500 hover:underline"
				>
					View Progress
				</a>
			{/snippet}

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
					{#each exercise.sets as set (set.set_index)}
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
		</SectionCard>
	{/each}
	</div>
</div>

