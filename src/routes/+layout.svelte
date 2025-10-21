<script>
	let { children } = $props();
</script>

<nav>
	<a href="/">home</a>
	<a href="/workouts">workouts</a>
	<a href="/exercises">exercises</a>
</nav>

{@render children()}

<style>
  nav {
    display: flex;
    justify-content: center;
    gap: 2rem;
    margin: 2rem 0;
  }
  nav a {
    text-decoration: none;
    color: #1976d2;
    font-weight: 500;
    font-size: 1.1rem;
    transition: color 0.2s;
  }
  nav a:hover {
    color: #0d47a1;
    text-decoration: underline;
  }
</style>