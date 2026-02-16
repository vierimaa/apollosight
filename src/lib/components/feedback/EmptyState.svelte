<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		message: string;
		icon?: Snippet;
		action?: Snippet;
		class?: string;
	}

	let { message, icon, action, class: className = '' }: Props = $props();
</script>

<div class="flex flex-col items-center justify-center py-12 px-4 {className}">
	{#if icon}
		<div class="text-surface-400-600 mb-4">
			{@render icon()}
		</div>
	{/if}
	
	<p class="text-surface-600-400 text-center mb-4">{message}</p>
	
	{#if action}
		<div>
			{@render action()}
		</div>
	{/if}
</div>
