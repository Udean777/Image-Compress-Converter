<script lang="ts">
	import {
		IconStar,
		IconDashboard,
		IconHistory,
		IconSettings,
		IconChevronLeft
	} from '$lib/components/icons';
	import { page } from '$app/stores';

	interface Props {
		credits: number;
		collapsed?: boolean;
		onToggleCollapse?: () => void;
	}

	let { credits, collapsed = false, onToggleCollapse }: Props = $props();

	const navItems = [
		{ href: '/dashboard', label: 'Dashboard', icon: IconDashboard },
		{ href: '/dashboard/history', label: 'History', icon: IconHistory },
		{ href: '/dashboard/settings', label: 'Settings', icon: IconSettings }
	];
</script>

<aside
	class="fixed top-0 left-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 {collapsed
		? 'w-20'
		: 'w-64'}"
>
	<!-- Logo -->
	<div class="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
		<div class="flex items-center gap-3">
			<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg">
				<span class="text-lg font-bold text-primary-foreground">IS</span>
			</div>
			{#if !collapsed}
				<h1 class="text-lg font-bold text-sidebar-foreground">Image Studio</h1>
			{/if}
		</div>
		<button
			onclick={onToggleCollapse}
			class="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
		>
			<IconChevronLeft class="h-5 w-5 transition-transform {collapsed ? 'rotate-180' : ''}" />
		</button>
	</div>

	<!-- Navigation -->
	<nav class="flex-1 space-y-1 p-3">
		{#each navItems as item}
			{@const isActive = $page.url.pathname === item.href}
			<a
				href={item.href}
				class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all {isActive
					? 'bg-sidebar-accent text-sidebar-accent-foreground'
					: 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}"
			>
				<item.icon class="h-5 w-5 shrink-0" />
				{#if !collapsed}
					<span>{item.label}</span>
				{/if}
			</a>
		{/each}
	</nav>

	<!-- Credits display -->
	<div class="border-t border-sidebar-border p-3">
		<div
			class="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 {collapsed
				? 'justify-center'
				: ''}"
		>
			<IconStar class="h-4 w-4 shrink-0 text-amber-500 dark:text-amber-400" />
			{#if !collapsed}
				<span class="text-sm font-semibold text-amber-600 dark:text-amber-400"
					>{credits} Credits</span
				>
			{/if}
		</div>
	</div>
</aside>
