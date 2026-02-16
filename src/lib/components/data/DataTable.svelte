<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		class?: string;
	}

	let { children, class: className = '' }: Props = $props();
</script>

<div class="overflow-x-auto {className}">
	<table class="w-full border-collapse">
		{@render children()}
	</table>
</div>

<style>
	table :global(thead) {
		background-color: rgb(var(--color-surface-200) / var(--tw-bg-opacity, 1));
	}

	:global([data-mode='dark']) table :global(thead) {
		background-color: rgb(var(--color-surface-800) / var(--tw-bg-opacity, 1));
	}

	table :global(th) {
		padding: 0.75rem 1rem;
		text-align: left;
		font-size: 0.875rem;
		font-weight: 600;
		color: rgb(var(--color-surface-700) / var(--tw-text-opacity, 1));
	}

	:global([data-mode='dark']) table :global(th) {
		color: rgb(var(--color-surface-300) / var(--tw-text-opacity, 1));
	}

	table :global(tbody tr) {
		border-top-width: 1px;
		border-color: rgb(var(--color-surface-200) / var(--tw-border-opacity, 1));
	}

	:global([data-mode='dark']) table :global(tbody tr) {
		border-color: rgb(var(--color-surface-800) / var(--tw-border-opacity, 1));
	}

	table :global(tbody tr:hover) {
		background-color: rgb(var(--color-surface-100) / var(--tw-bg-opacity, 1));
	}

	:global([data-mode='dark']) table :global(tbody tr:hover) {
		background-color: rgb(var(--color-surface-900) / var(--tw-bg-opacity, 1));
	}

	table :global(td) {
		padding: 0.75rem 1rem;
		font-size: 0.875rem;
		color: rgb(var(--color-surface-900) / var(--tw-text-opacity, 1));
	}

	:global([data-mode='dark']) table :global(td) {
		color: rgb(var(--color-surface-100) / var(--tw-text-opacity, 1));
	}
</style>
