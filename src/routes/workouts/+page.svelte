<script> 
	let { data } = $props();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}-${month}-${year}, ${hours}:${minutes}`;
  };
</script>

<h1>Workout data</h1>

<h2>Grouped by workout session</h2>
{#each data.sessionData as { key, values }}
  <h3>Date: {formatDate(key)}, Duration: {(values[0].duration_seconds)/60} minutes</h3>
  <table>
    <thead>
      <tr>
        <th>Title</th>
        <th>Duration in minutes</th>
        <th>Description</th>
        <th>Exercise Title</th>
        <th>Set</th>
        <th>Weight (kg)</th>
        <th>Reps</th>
        <!-- Add more columns as needed -->
      </tr>
    </thead>
    <tbody>
      {#each values as workout}
        <tr>
          <td>{workout.title}</td>
          <td>{workout.duration_seconds / 60}</td>
          <td>{workout.description}</td>
          <td>{workout.exercise_title}</td>
          <td>{Number(workout.set_index)  + 1}</td>
          <td>{workout.weight_kg}</td>
          <td>{workout.reps}</td>
          <!-- Display more fields as needed -->
        </tr>
      {/each}
    </tbody>
  </table>
{/each}

<h2>All Workout Data</h2>
<table>
  <thead>
    <tr>
      <th>Title</th>
      <th>Duration in seconds</th>
      <th>Start Time</th>
      <th>Description</th>
      <th>Exercise Title</th>
      <th>Weight (kg)</th>
      <th>Reps</th>
      <!-- Add more columns as needed -->
    </tr>
  </thead>
  <tbody>
    {#each data.jsonData as workout}
      <tr>
        <td>{workout.title}</td>
        <td>{workout.duration_seconds / 60}</td>
        <td>{workout.start_time}</td>
        <td>{workout.description}</td>
        <td>{workout.exercise_title}</td>
        <td>{workout.weight_kg}</td>
        <td>{workout.reps}</td>
        <!-- Display more fields as needed -->
      </tr>
    {/each}
  </tbody>
</table>
