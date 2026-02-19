<script lang="ts">
	import { PageHeader, StatCard, SectionCard, DataTable } from '$lib';
	import type { WorkoutSession } from '$lib';
	import { formatDate, formatDuration } from '$lib/utils/format';
	import { Dumbbell, Clock, ListChecks } from 'lucide-svelte';

	let { data } = $props();

	// Get today's date and 14 days ago
	const now = new Date();
	const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

	// Filter workouts from the last 2 weeks
	const recentWorkouts = $derived(
		data.workoutData.filter(
			(workout: WorkoutSession) => new Date(workout.start_time) >= twoWeeksAgo
		)
	);

	// Calculate statistics
	const totalWorkouts = $derived(recentWorkouts.length);
	const totalDuration = $derived(
		recentWorkouts.reduce(
			(sum: number, workout: WorkoutSession) => sum + (workout.duration_seconds ?? 0),
			0
		)
	);
	const totalExercises = $derived(
		recentWorkouts.reduce(
			(sum: number, workout: WorkoutSession) => sum + workout.exercises.length,
			0
		)
	);

	// Get the 5 most recent workouts for display
	const recentWorkoutsList = $derived(
		[...data.workoutData]
			.sort((workoutA: WorkoutSession, workoutB: WorkoutSession) => new Date(workoutB.start_time).getTime() - new Date(workoutA.start_time).getTime())
			.slice(0, 5)
	);
</script>

<PageHeader title="Dashboard" />

<div class="p-6 space-y-6">
	<!-- Stats Grid -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
		<StatCard title="Workouts (2 weeks)" value={totalWorkouts}>
			{#snippet icon()}
				<Dumbbell class="w-8 h-8" />
			{/snippet}
		</StatCard>

		<StatCard title="Total Duration" value={formatDuration(totalDuration)}>
			{#snippet icon()}
				<Clock class="w-8 h-8" />
			{/snippet}
		</StatCard>

		<StatCard title="Total Exercises" value={totalExercises}>
			{#snippet icon()}
				<ListChecks class="w-8 h-8" />
			{/snippet}
		</StatCard>
	</div>

	<!-- Recent Workouts -->
	<SectionCard title="Recent Workouts">
		{#snippet children()}
			<DataTable>
				<thead>
					<tr>
						<th>Date</th>
						<th>Title</th>
						<th>Duration</th>
						<th>Exercises</th>
					</tr>
				</thead>
				<tbody>
					{#each recentWorkoutsList as workout}
						<tr>
							<td>{formatDate(workout.start_time)}</td>
							<td>
								<a
									href="/workouts/{workout.uuid}"
									class="text-primary-500 hover:underline"
								>
									{workout.title}
								</a>
							</td>
							<td>{formatDuration(workout.duration_seconds)}</td>
							<td>{workout.exercises.length}</td>
						</tr>
					{/each}
				</tbody>
			</DataTable>
		{/snippet}
	</SectionCard>
</div>
