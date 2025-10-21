<script lang="ts">
  let { data } = $props();

  // Get today's date and 14 days ago
  const now = new Date();
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Filter workouts from the last 2 weeks
  const recentWorkouts = data.workoutData.filter(
    w => new Date(w.start_time) >= twoWeeksAgo
  );

   // Calculate statistics
  const totalWorkouts = recentWorkouts.length;
  const totalDuration = recentWorkouts.reduce((sum, w) => sum + (w.duration_seconds || 0), 0);
  const totalExercises = recentWorkouts.reduce((sum, w) => sum + (w.exercises ? w.exercises.length : 0), 0);

  // Format duration as hh:mm
  function formatDuration(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}min`;
  }
</script>

<div class="center-content">
  <h1>GYM VIEW</h1>
  <section>
    <h2>Last 2 Weeks Overview</h2>
    <ul>
      <li><strong>Workouts:</strong> {totalWorkouts}</li>
      <li><strong>Total duration:</strong> {formatDuration(totalDuration)}</li>
      <li><strong>Total exercises:</strong> {totalExercises}</li>
    </ul>
  </section>
</div>

<style>
  .center-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
  }
  h1 {
    margin-bottom: 2rem;
    font-size: 2.2rem;
    color: #1976d2;
  }
  section {
    background: #f5f5f5;
    padding: 2rem 2.5rem;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(44, 62, 80, 0.06);
  }
  h2 {
    margin-bottom: 1rem;
    color: #2c3e50;
  }
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    font-size: 1.1rem;
  }
  li {
    margin-bottom: 0.5rem;
  }
</style>