<script lang="ts">
  const { data } = $props();

  // Helper to create a slug from the exercise title
  function slugify(title: string) {
    return title.replace(/\s+/g, "-").toLowerCase();
  }

  let filter = $state("");

  const filteredExercises = $derived(() =>
    data.exercises.filter((exercise) =>
      exercise.toLowerCase().includes(filter.trim().toLowerCase())
    )
  );
</script>

<div class="container">
  <h1>All Exercises</h1>
  <input
    class="filter-box"
    type="text"
    placeholder="Filter exercises..."
    value={filter}
    oninput={(e) => {
      console.log((e.currentTarget as HTMLInputElement).value);
      filter = (e.currentTarget as HTMLInputElement).value;
    }}
  />
  <ul class="exercise-list">
    {#each filteredExercises() as exercise}
      <li>
        <a href={`/exercises/${slugify(exercise)}`}>{exercise}</a>
      </li>
    {/each}
  </ul>
</div>

<style>
  h1 {
    margin-bottom: 1.5rem;
    font-size: 2rem;
    color: #2c3e50;
  }

  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;
    min-height: 100vh; /* optional for vertical centering */
  }

  .exercise-list {
    list-style: none;
    padding: 0;
    max-width: 400px;
    margin: 0;
  }

  .exercise-list li {
    margin-bottom: 0.75rem;
    background: #f5f5f5;
    border-radius: 6px;
    transition: background 0.2s;
    padding: 0.5rem 1rem;
  }

  .exercise-list li:hover {
    background: #e0e7ef;
  }

  .exercise-list a {
    text-decoration: none;
    color: #1976d2;
    font-weight: 500;
    font-size: 1.1rem;
    transition: color 0.2s;
  }

  .exercise-list a:hover {
    color: #0d47a1;
    text-decoration: underline;
  }

  .filter-box {
    margin-bottom: 1rem;
    padding: 0.5rem 1rem;
    font-size: 1rem;
    border: 1px solid #ccc;
    border-radius: 6px;
    width: 100%;
    max-width: 400px;
    box-sizing: border-box;
    display: block;
  }
</style>
