<script lang="ts">
	import { IconLogout, IconUser, IconSun, IconMoon, IconMenu } from '$lib/components/icons';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { enhance } from '$app/forms';
	import type { Snippet } from 'svelte';

	interface User {
		name: string | null;
		email: string;
		avatarUrl: string | null;
	}

	interface Props {
		user: User;
		isDarkMode?: boolean;
		onToggleDarkMode?: () => void;
		logoutForm?: Snippet;
	}

	let { user, isDarkMode = true, onToggleDarkMode, logoutForm }: Props = $props();
</script>

<header
	class="sticky top-0 z-30 flex h-16 items-center justify-end gap-4 border-b border-white/10 bg-slate-900/80 px-6 backdrop-blur-xl"
>
	<!-- Mobile menu button (shown on small screens) -->
	<button
		class="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white md:hidden"
	>
		<IconMenu class="h-5 w-5" />
	</button>

	<div class="flex-1 md:hidden"></div>

	<!-- Right side: Dark mode toggle & Profile -->
	<div class="flex items-center gap-3">
		<!-- Dark mode toggle -->
		<button
			onclick={onToggleDarkMode}
			class="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-all hover:border-violet-500/30 hover:bg-violet-500/10 hover:text-violet-400"
			title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
		>
			{#if isDarkMode}
				<IconMoon class="h-4 w-4" />
			{:else}
				<IconSun class="h-4 w-4" />
			{/if}
		</button>

		<!-- Profile Dropdown -->
		<DropdownMenu.Root>
			<DropdownMenu.Trigger
				class="flex items-center gap-2 rounded-full p-1 transition-all hover:bg-white/10"
			>
				{#if user.avatarUrl}
					<img
						src={user.avatarUrl}
						alt={user.name || user.email}
						class="h-9 w-9 rounded-full object-cover ring-2 ring-white/10"
					/>
				{:else}
					<div
						class="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-violet-500 to-purple-600 text-sm font-semibold text-white ring-2 ring-white/10"
					>
						{(user.name || user.email).charAt(0).toUpperCase()}
					</div>
				{/if}
			</DropdownMenu.Trigger>

			<DropdownMenu.Content align="end" class="w-56">
				<DropdownMenu.Label>
					<div class="flex flex-col">
						<span class="font-medium">{user.name || 'User'}</span>
						<span class="text-xs text-slate-400">{user.email}</span>
					</div>
				</DropdownMenu.Label>

				<DropdownMenu.Separator />

				<a href="/dashboard/settings">
					<DropdownMenu.Item>
						<IconUser class="mr-2 h-4 w-4" />
						Profile
					</DropdownMenu.Item>
				</a>

				<DropdownMenu.Item onclick={onToggleDarkMode}>
					{#if isDarkMode}
						<IconSun class="mr-2 h-4 w-4" />
						Light Mode
					{:else}
						<IconMoon class="mr-2 h-4 w-4" />
						Dark Mode
					{/if}
				</DropdownMenu.Item>

				<DropdownMenu.Separator />

				<!-- Logout form passed from parent -->
				{#if logoutForm}
					{@render logoutForm()}
				{/if}
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>
</header>
