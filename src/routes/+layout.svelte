<script>
	let { children } = $props();
</script>

<nav>
	<a href="/">home</a>
	<a href="/workouts">workouts</a>
	<a href="/exercises">exercises</a>
</nav>

{@render children()}
