<script lang="ts">
  import { formatDate } from "$lib/utils/format";
  let { data } = $props();
</script>

<h1>Workout data</h1>
<p>Total workouts: {data.jsonData.length}</p>
<h2>Workout Sessions</h2>

<ul>
  {#each data.jsonData as workout}
    <li>
      <a href={`/workouts/${workout.uuid}`}>
        {workout.title} — {formatDate(workout.start_time)}
      </a>
    </li>
  {/each}
</ul>
