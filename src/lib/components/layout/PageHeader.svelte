<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		back?: Snippet;
		actions?: Snippet;
	}

	let { title, back, actions }: Props = $props();
</script>

<div class="bg-surface-50-950 border-b border-surface-200-800">
	<div class="px-6 py-4 flex flex-col gap-1">
		{#if back}
			<div>{@render back()}</div>
		{/if}
		<div class="flex items-center justify-between gap-6">
			<h1 class="text-2xl font-bold text-surface-950-50">{title}</h1>
			{#if actions}
				<div class="flex items-center gap-3">
					{@render actions()}
				</div>
			{/if}
		</div>
	</div>
</div>
