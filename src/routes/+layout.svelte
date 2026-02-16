<script>
	import '../app.css';
	import { AppShell } from '$lib';

	let { children } = $props();
</script>

<AppShell>
	{@render children()}
</AppShell>