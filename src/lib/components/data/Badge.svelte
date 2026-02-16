<script lang="ts">
	type Variant = 'default' | 'success' | 'warning' | 'error' | 'info';

	interface Props {
		label: string;
		variant?: Variant;
		class?: string;
	}

	let { label, variant = 'default', class: className = '' }: Props = $props();

	const variantClasses = {
		default: 'bg-surface-300-700 text-surface-700-300',
		success: 'bg-success-500/20 text-success-500',
		warning: 'bg-warning-500/20 text-warning-500',
		error: 'bg-error-500/20 text-error-500',
		info: 'bg-primary-500/20 text-primary-500'
	};
</script>

<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {variantClasses[variant]} {className}">
	{label}
</span>
