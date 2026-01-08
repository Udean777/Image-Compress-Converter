<script lang="ts">
	import type { LayoutProps } from './$types';
	import { Sidebar, Header } from '$lib/components/dashboard';
	import { IconLogout } from '$lib/components/icons';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { enhance } from '$app/forms';
	import { Toaster } from 'svelte-sonner';

	let { data, children }: LayoutProps = $props();

	let isDarkMode = $state(true);

	let sidebarCollapsed = $state(false);

	let showLogoutDialog = $state(false);

	function toggleDarkMode() {
		isDarkMode = !isDarkMode;
	}

	function toggleSidebar() {
		sidebarCollapsed = !sidebarCollapsed;
	}
</script>

<div class="flex min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900">
	<Sidebar
		credits={data.user.credits}
		collapsed={sidebarCollapsed}
		onToggleCollapse={toggleSidebar}
	/>

	<div
		class="flex flex-1 flex-col transition-all duration-300 {sidebarCollapsed ? 'ml-20' : 'ml-64'}"
	>
		<Header user={data.user} {isDarkMode} onToggleDarkMode={toggleDarkMode}>
			{#snippet logoutForm()}
				<button type="button" onclick={() => (showLogoutDialog = true)} class="w-full text-left">
					<DropdownMenu.Item class="text-red-400 focus:bg-red-500/10 focus:text-red-400">
						<IconLogout class="mr-2 h-4 w-4" />
						Logout
					</DropdownMenu.Item>
				</button>
			{/snippet}
		</Header>

		<main class="flex-1 p-6 md:p-10">
			<div class="mx-auto max-w-6xl">
				{@render children()}
			</div>
		</main>
	</div>
</div>

<Dialog.Root bind:open={showLogoutDialog}>
	<Dialog.Content class="border-white/10 bg-slate-900 sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="text-white">Confirm Logout</Dialog.Title>
			<Dialog.Description class="text-slate-400">
				Are you sure you want to logout? You will need to sign in again to access your account.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer class="flex gap-3 sm:justify-end">
			<Button
				variant="outline"
				onclick={() => (showLogoutDialog = false)}
				class="border-white/10 bg-transparent text-white hover:bg-white"
			>
				Cancel
			</Button>
			<form method="POST" action="?/logout" use:enhance>
				<Button type="submit" variant="destructive" class="bg-red-600 text-white hover:bg-red-700">
					<IconLogout class="mr-2 h-4 w-4" />
					Logout
				</Button>
			</form>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<Toaster position="top-right" richColors theme="dark" />
