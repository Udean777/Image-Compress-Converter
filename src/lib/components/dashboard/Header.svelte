<script lang="ts">
	import { IconLogout, IconUser, IconSun, IconMoon, IconMenu } from '$lib/components/icons';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { enhance } from '$app/forms';
	import type { Snippet } from 'svelte';
	import { mode, setMode } from 'mode-watcher';

	interface User {
		name: string | null;
		email: string;
		avatarUrl: string | null;
	}

	interface Props {
		user: User;
		logoutForm?: Snippet;
	}

	let { user, logoutForm }: Props = $props();

	function toggleTheme() {
		setMode(mode.current === 'dark' ? 'light' : 'dark');
	}
</script>

<header
	class="sticky top-0 z-30 flex h-16 items-center justify-end gap-4 border-b border-border bg-background/80 px-6 backdrop-blur-xl"
>
	<button
		class="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
	>
		<IconMenu class="h-5 w-5" />
	</button>

	<div class="flex-1 md:hidden"></div>

	<div class="flex items-center gap-3">
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

				{#if logoutForm}
					{@render logoutForm()}
				{/if}
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>
</header>
