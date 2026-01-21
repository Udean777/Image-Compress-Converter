<script lang="ts">
	import { IconUser, IconMoon, IconSun } from '$lib/components/icons';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { mode, setMode } from 'mode-watcher';
	import type { Snippet } from 'svelte';
	import { page } from '$app/stores';
	import { Search, ChevronRight, Zap } from '@lucide/svelte';

	interface User {
		name: string | null;
		email: string;
		avatarUrl: string | null;
		role: string;
		createdAt: Date;
		planTier?: string;
	}

	interface Props {
		user: any;
		children?: Snippet;
	}

	let { user, children }: Props = $props();

	function toggleTheme() {
		setMode(mode.current === 'dark' ? 'light' : 'dark');
	}

	function getBreadcrumbs(path: string) {
		const parts = path.split('/').filter(Boolean);
		return parts.map((part, index) => {
			const href = '/' + parts.slice(0, index + 1).join('/');
			const label = part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' ');
			return { href, label, isLast: index === parts.length - 1 };
		});
	}

	let breadcrumbs = $derived(getBreadcrumbs($page.url.pathname));
</script>

<header
	class="sticky top-0 z-30 flex h-16 w-full items-center justify-between gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-xl md:px-6"
>
	<div class="flex items-center gap-4">
		<Sidebar.Trigger />

		<!-- Breadcrumbs (Hidden on mobile) -->
		<nav class="hidden items-center gap-1 text-sm text-muted-foreground md:flex">
			{#each breadcrumbs as crumb, i}
				{#if i > 0}
					<ChevronRight class="size-4" />
				{/if}
				{#if crumb.isLast}
					<span class="font-medium text-foreground">{crumb.label}</span>
				{:else}
					<a href={crumb.href} class="transition-colors hover:text-primary">{crumb.label}</a>
				{/if}
			{/each}
		</nav>
	</div>

	<!-- Mobile Page Title (Visible only on mobile) -->
	<div class="max-w-37.5 truncate font-semibold text-foreground md:hidden">
		{breadcrumbs[breadcrumbs.length - 1]?.label || 'Dashboard'}
	</div>

	<div class="flex items-center gap-2">
		<!-- Search Bar -->
		<div class="relative hidden w-full max-w-sm lg:block">
			<Search class="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
			<Input
				type="search"
				placeholder="Search..."
				class="peer h-9 w-64 pl-9 text-sm transition-all duration-300 focus:w-80"
			/>
		</div>

		<!-- Upgrade Button (Visible if free) -->
		{#if user?.planTier === 'free'}
			<Button
				size="sm"
				variant="default"
				class="hidden gap-2 border-0 bg-linear-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 sm:flex"
				href="/dashboard/upgrade"
			>
				<Zap class="size-3.5 fill-current" />
				<span class="text-xs font-bold">Upgrade</span>
			</Button>
		{/if}

		<button
			onclick={toggleTheme}
			class="flex aspect-square h-9 w-9 items-center justify-center rounded-full border border-border bg-secondary text-foreground transition-all hover:bg-accent hover:text-accent-foreground"
			title={mode.current === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
		>
			{#if mode.current === 'dark'}
				<IconMoon class="h-4 w-4" />
			{:else}
				<IconSun class="h-4 w-4" />
			{/if}
		</button>

		<DropdownMenu.Root>
			<DropdownMenu.Trigger
				class="flex items-center gap-2 rounded-full p-1 transition-all hover:bg-accent"
			>
				{#if user.avatarUrl}
					<img
						src={user.avatarUrl}
						alt={user.name || user.email}
						class="h-9 w-9 rounded-full object-cover ring-2 ring-border"
					/>
				{:else}
					<div
						class="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground ring-2 ring-border"
					>
						{(user.name || user.email).charAt(0).toUpperCase()}
					</div>
				{/if}
			</DropdownMenu.Trigger>

			<DropdownMenu.Content align="end" class="w-56 bg-popover text-popover-foreground">
				<DropdownMenu.Label>
					<div class="flex flex-col">
						<span class="font-medium text-primary">{user.name || 'User'}</span>
						<span class="text-xs text-muted-foreground">{user.email}</span>
					</div>
				</DropdownMenu.Label>

				<DropdownMenu.Separator />

				<a href="/dashboard/settings" class="text-primary">
					<DropdownMenu.Item>
						<IconUser class="mr-2 h-4 w-4" />
						Profile
					</DropdownMenu.Item>
				</a>

				<DropdownMenu.Item onclick={toggleTheme}>
					{#if mode.current === 'dark'}
						<IconSun class="mr-2 h-4 w-4" />
						Light Mode
					{:else}
						<IconMoon class="mr-2 h-4 w-4" />
						Dark Mode
					{/if}
				</DropdownMenu.Item>

				<DropdownMenu.Separator />

				{#if children}
					{@render children()}
				{:else}
					<button class="w-full text-left">
						<DropdownMenu.Item>Logout</DropdownMenu.Item>
					</button>
				{/if}
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>
</header>
