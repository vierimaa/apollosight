<script lang="ts">
	import { AppBar } from '@skeletonlabs/skeleton-svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		actions?: Snippet;
	}

	let { title, actions }: Props = $props();
</script>

<AppBar class="bg-surface-50-950 border-b border-surface-200-800">
	<AppBar.Toolbar class="px-6 py-4">
		<AppBar.Headline>
			<h1 class="text-2xl font-bold text-surface-950-50">{title}</h1>
		</AppBar.Headline>
		{#if actions}
			<AppBar.Trail>
				<div class="flex items-center gap-3">
					{@render actions()}
				</div>
			</AppBar.Trail>
		{/if}
	</AppBar.Toolbar>
</AppBar>
