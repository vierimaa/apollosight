<script> 
	let { data } = $props();
</script>

<h1>Workout data</h1>
<p>Here is all the workout data</p>

<table>
  <thead>
    <tr>
      <th>Title</th>
      <th>Start Time</th>
      <th>End Time</th>
      <th>Description</th>
      <th>Exercise Title</th>
      <th>Weight (kg)</th>
      <th>Reps</th>
      <!-- Add more columns as needed -->
    </tr>
  </thead>
  <tbody>
    {#each data.csvData as workout}
      <tr>
        <td>{workout.title}</td>
        <td>{workout.start_time}</td>
        <td>{workout.end_time}</td>
        <td>{workout.description}</td>
        <td>{workout.exercise_title}</td>
        <td>{workout.weight_kg}</td>
        <td>{workout.reps}</td>
        <!-- Display more fields as needed -->
      </tr>
    {/each}
  </tbody>
</table>
