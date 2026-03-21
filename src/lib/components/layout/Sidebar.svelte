<script lang="ts">
	import { page } from '$app/state';
	import { House, Dumbbell, ListChecks, Trophy, Layers, Scale, Flame, TrendingUp } from 'lucide-svelte';

	interface NavItem {
		href: string;
		label: string;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		icon: any;
	}

	const navItems: NavItem[] = [
		{ href: '/', label: 'Dashboard', icon: House },
		{ href: '/workouts', label: 'Workouts', icon: Dumbbell },
		{ href: '/exercises', label: 'Exercises', icon: ListChecks },
		{ href: '/programs', label: 'Programs', icon: Layers },
		{ href: '/stats', label: 'Stats', icon: Trophy },
		{ href: '/insights', label: 'Insights', icon: TrendingUp },
		{ href: '/weight', label: 'Weight', icon: Scale },
		{ href: '/nutrition', label: 'Nutrition', icon: Flame }
	];

	const isActive = (href: string, pathname: string): boolean => {
		if (href === '/') return pathname === '/';
		return pathname.startsWith(href);
	};
</script>

<aside class="flex flex-col h-screen w-64 bg-surface-100-900 border-r border-surface-300-700">
	<!-- Logo/Brand -->
	<div class="p-6 border-b border-surface-300-700">
		<h1 class="text-2xl font-bold text-surface-950-50">ApolloSight</h1>
		<p class="text-sm text-surface-600-400">Fitness Dashboard</p>
	</div>

	<!-- Navigation -->
	<nav class="flex-1 p-4 space-y-2">
		{#each navItems as item}
			{@const active = isActive(item.href, page.url.pathname)}
			{@const Icon = item.icon}
			<a
				href={item.href}
				class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
					{active 
						? 'bg-primary-500 text-white' 
						: 'text-surface-700-300 hover:bg-surface-200-800'}"
			>
				<Icon class="w-5 h-5" />
				<span class="font-medium">{item.label}</span>
			</a>
		{/each}
	</nav>
</aside>
