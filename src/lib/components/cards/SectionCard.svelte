<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		subtitle?: string;
		children: Snippet;
		headerAction?: Snippet;
		class?: string;
	}

	let { title, subtitle, children, headerAction, class: className = '' }: Props = $props();
</script>

<div class="preset-filled-surface-100-900 rounded-lg shadow-sm overflow-hidden {className}">
	<!-- Header -->
	<div class="flex items-center justify-between px-6 py-4 border-b border-surface-300-700">
		<div>
			<h2 class="text-lg font-semibold text-surface-950-50">{title}</h2>
			{#if subtitle}
				<p class="text-sm text-surface-600-400 mt-0.5">{subtitle}</p>
			{/if}
		</div>
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
