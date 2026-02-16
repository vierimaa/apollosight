<script lang="ts">
	type SkeletonType = 'card' | 'table' | 'text';

	interface Props {
		lines?: number;
		type?: SkeletonType;
		class?: string;
	}

	let { lines = 3, type = 'text', class: className = '' }: Props = $props();
</script>

{#if type === 'card'}
	<div class="preset-filled-surface-100-900 rounded-lg p-6 {className}">
		<div class="placeholder animate-pulse h-4 w-1/3 mb-4"></div>
		<div class="placeholder animate-pulse h-8 w-1/2 mb-2"></div>
		<div class="placeholder animate-pulse h-4 w-1/4"></div>
	</div>
{:else if type === 'table'}
	<div class="{className}">
		{#each Array(lines) as _, i}
			<div class="flex gap-4 py-3 border-t border-surface-200-800">
				<div class="placeholder animate-pulse h-4 w-1/4"></div>
				<div class="placeholder animate-pulse h-4 w-1/3"></div>
				<div class="placeholder animate-pulse h-4 w-1/6"></div>
			</div>
		{/each}
	</div>
{:else}
	<div class="space-y-3 {className}">
		{#each Array(lines) as _, i}
			<div class="placeholder animate-pulse h-4 w-full" style="width: {100 - i * 15}%"></div>
		{/each}
	</div>
{/if}

<style>
	.placeholder {
		background-color: rgb(var(--color-surface-300) / var(--tw-bg-opacity, 1));
		border-radius: 0.25rem;
	}

	:global([data-mode='dark']) .placeholder {
		background-color: rgb(var(--color-surface-700) / var(--tw-bg-opacity, 1));
	}

	.animate-pulse {
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}
</style>
