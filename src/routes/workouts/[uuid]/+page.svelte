<script lang="ts">
  import { formatDate, formatDuration } from "$lib/utils/format";
  let { data } = $props();

  const { workout } = data;
</script>

<h1>{workout.title}</h1>
<p><strong>Date:</strong> {formatDate(workout.start_time)}</p>
<p><strong>Duration:</strong> {formatDuration(workout.duration_seconds)}</p>

<h2>Exercises</h2>
{#each workout.exercises as exercise}
  <section style="margin-bottom: 2rem;">
    <h3>{exercise.exercise_title}</h3>
    {#if exercise.exercise_notes}
      <p><em>Notes: {exercise.exercise_notes}</em></p>
    {/if}
    <table>
      <thead>
        <tr>
          <th>Set</th>
          <th>Type</th>
          <th>Weight (kg)</th>
          <th>Reps</th>
        </tr>
      </thead>
      <tbody>
        {#each exercise.sets as set}
          <tr>
            <td>{+set.set_index + 1}</td>
            <td>{set.set_type}</td>
            <td>{set.weight_kg}</td>
            <td>{set.reps}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </section>
{/each}

<style>
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 0.5rem;
  }

  th,
  td {
    border: 1px solid #ccc;
    padding: 0.5rem;
    text-align: center;
  }

  th {
    background-color: #f5f5f5;
  }
</style>
