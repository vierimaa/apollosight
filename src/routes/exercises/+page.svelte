<script lang="ts">
  let { data } = $props();

  // Helper to create a slug from the exercise title
  function slugify(title: string) {
    return title.replace(/\s+/g, '-').toLowerCase();
  }
</script>

<h1>All Exercises</h1>
<ul class="exercise-list">
  {#each data.exercises as exercise}
    <li>
      <a href={`/exercises/${slugify(exercise)}`}>{exercise}</a>
    </li>
  {/each}
</ul>

<style>
  h1 {
    margin-bottom: 1.5rem;
    font-size: 2rem;
    color: #2c3e50;
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
</style>