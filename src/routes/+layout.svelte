<script>
	let { children } = $props();
</script>

<nav>
	<a href="/">home</a>
	<a href="/workouts">workouts</a>
</nav>

{@render children()}
