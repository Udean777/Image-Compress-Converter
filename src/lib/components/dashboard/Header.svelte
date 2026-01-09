<script lang="ts">
	import { IconUser, IconMoon, IconSun } from '$lib/components/icons';
	import * as Avatar from '$lib/components/ui/avatar';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { Button } from '$lib/components/ui/button';
	import { mode, setMode } from 'mode-watcher';
	import type { Snippet } from 'svelte';

	interface User {
		name: string | null;
		email: string;
		avatarUrl: string | null;
	}

	interface Props {
		user: User;
		children?: Snippet;
	}

	let { user, children }: Props = $props();

	function toggleTheme() {
		setMode(mode.current === 'dark' ? 'light' : 'dark');
	}
</script>

<header
	class="sticky top-0 z-30 flex h-16 w-full items-center justify-between gap-4 overflow-x-hidden border-b border-border bg-background/80 px-4 backdrop-blur-xl md:px-6"
>
	<Sidebar.Trigger />

	<div class="flex items-center gap-2">
		<button
			onclick={toggleTheme}
			class="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-secondary text-foreground transition-all hover:bg-accent hover:text-accent-foreground"
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
