<script lang="ts">
	import type { Snippet } from 'svelte';
	import { TrendingUp, TrendingDown } from 'lucide-svelte';

	interface Trend {
		value: number;
		direction: 'up' | 'down';
	}

	interface Props {
		title: string;
		value: string | number;
		icon?: Snippet;
		trend?: Trend;
		class?: string;
	}

	let { title, value, icon, trend, class: className = '' }: Props = $props();
</script>

<div class="preset-filled-surface-100-900 rounded-lg p-6 shadow-sm {className}">
	<div class="flex items-start justify-between">
		<div class="flex-1">
			<p class="text-sm font-medium text-surface-600-400 mb-1">{title}</p>
			<p class="text-3xl font-bold text-surface-950-50">{value}</p>
			
			{#if trend}
				<div class="flex items-center gap-1 mt-2">
					{#if trend.direction === 'up'}
						<TrendingUp class="w-4 h-4 text-success-500" />
						<span class="text-sm font-medium text-success-500">+{trend.value}%</span>
					{:else}
						<TrendingDown class="w-4 h-4 text-error-500" />
						<span class="text-sm font-medium text-error-500">-{trend.value}%</span>
					{/if}
				</div>
			{/if}
		</div>
		
		{#if icon}
			<div class="text-surface-400-600">
				{@render icon()}
			</div>
		{/if}
	</div>
</div>
