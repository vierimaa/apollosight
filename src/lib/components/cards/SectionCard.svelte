<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		children: Snippet;
		headerAction?: Snippet;
		class?: string;
	}

	let { title, children, headerAction, class: className = '' }: Props = $props();
</script>

<div class="preset-filled-surface-100-900 rounded-lg shadow-sm overflow-hidden {className}">
	<!-- Header -->
	<div class="flex items-center justify-between px-6 py-4 border-b border-surface-300-700">
		<h2 class="text-lg font-semibold text-surface-950-50">{title}</h2>
		{#if headerAction}
			<div class="flex items-center gap-2">
				{@render headerAction()}
			</div>
		{/if}
	</div>
	
	<!-- Content -->
	<div class="p-6">
		{@render children()}
	</div>
</div>
