<script lang="ts">
	import { PageHeader, StatCard, SectionCard, DataTable, Badge, EmptyState, BarChart } from '$lib';
	import { slugify } from '$lib/utils/format';
	import { Dumbbell, Clock, ListChecks, Flame, Scale } from 'lucide-svelte';

	let { data } = $props();
</script>

<PageHeader title="Dashboard" />

<div class="p-6 space-y-6">
	<!-- Stats Grid -->
	<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
		<StatCard title="Workouts (2 weeks)" value={data.stats.totalWorkouts} trend={data.trends.workouts}>
			{#snippet icon()}
				<Dumbbell class="w-8 h-8" />
			{/snippet}
		</StatCard>

		<StatCard title="Duration (2 weeks)" value={data.stats.totalDuration} trend={data.trends.duration}>
			{#snippet icon()}
				<Clock class="w-8 h-8" />
			{/snippet}
		</StatCard>

		<StatCard title="Exercises (2 weeks)" value={data.stats.totalExercises} trend={data.trends.exercises}>
			{#snippet icon()}
				<ListChecks class="w-8 h-8" />
			{/snippet}
		</StatCard>

		<StatCard
			title="Current Streak"
			value="{data.currentStreak} {data.currentStreak === 1 ? 'week' : 'weeks'}"
		>
			{#snippet icon()}
				<Flame class="w-8 h-8" />
			{/snippet}
		</StatCard>

		<StatCard title="All-time Volume" value={data.allTimeVolumeFormatted}>
			{#snippet icon()}
				<Scale class="w-8 h-8" />
			{/snippet}
		</StatCard>
	</div>

	<!-- Weekly Frequency Chart -->
	<SectionCard title="Weekly Training Frequency">
		{#snippet children()}
			<BarChart labels={data.weeklyFrequency.labels} datasets={data.frequencyDatasets} />
		{/snippet}
	</SectionCard>

	<!-- Recent PRs -->
	<SectionCard title="Recent Personal Bests">
		{#snippet children()}
			{#if data.recentPrs.length === 0}
				<EmptyState message="No personal records detected yet." />
			{:else}
				<DataTable>
					<thead>
						<tr>
							<th>Date</th>
							<th>Exercise</th>
							<th>Type</th>
							<th>Value</th>
						</tr>
					</thead>
					<tbody>
						{#each data.recentPrs as prEvent}
							<tr>
								<td>{prEvent.dateFormatted}</td>
								<td>
									<a
										href="/exercises/{slugify(prEvent.exerciseTitle)}"
										class="text-primary-500 hover:underline"
									>
										{prEvent.exerciseTitle}
									</a>
								</td>
								<td>
									<Badge
										label={prEvent.prType}
										variant={prEvent.prType === '1RM' ? 'success' : 'info'}
									/>
								</td>
								<td>{prEvent.value} kg</td>
							</tr>
						{/each}
					</tbody>
				</DataTable>
			{/if}
		{/snippet}
	</SectionCard>

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
					{#each data.recentWorkouts as workout}
						<tr>
							<td>{workout.dateFormatted}</td>
							<td>
								<a href="/workouts/{workout.uuid}" class="text-primary-500 hover:underline">
									{workout.title}
								</a>
							</td>
							<td>{workout.duration}</td>
							<td>{workout.exerciseCount}</td>
						</tr>
					{/each}
				</tbody>
			</DataTable>
		{/snippet}
	</SectionCard>
</div>
