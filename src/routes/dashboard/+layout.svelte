<script lang="ts">
	import type { LayoutProps } from './$types';
	import AppSidebar from '$lib/components/dashboard/AppSidebar.svelte';
	import { Header } from '$lib/components/dashboard';
	import { IconLogout } from '$lib/components/icons';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { Button } from '$lib/components/ui/button';
	import { enhance } from '$app/forms';
	import { Toaster } from 'svelte-sonner';

	let { data, children }: LayoutProps = $props();

	let showLogoutDialog = $state(false);
</script>

<Sidebar.Provider>
	<AppSidebar user={data.user} />
	<Sidebar.Inset>
		<Header user={data.user}>
			<button type="button" onclick={() => (showLogoutDialog = true)} class="w-full text-left">
				<DropdownMenu.Item class="text-red-400 focus:bg-red-500/10 focus:text-red-400">
					<IconLogout class="mr-2 h-4 w-4" />
					Logout
				</DropdownMenu.Item>
			</button>
		</Header>

		<main class="flex w-full flex-col p-4 md:p-10">
			<div class="mx-auto w-full max-w-full">
				{@render children()}
			</div>
		</main>
	</Sidebar.Inset>
</Sidebar.Provider>

<Dialog.Root bind:open={showLogoutDialog}>
	<Dialog.Content class="border-border bg-card sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="text-foreground">Confirm Logout</Dialog.Title>
			<Dialog.Description class="text-muted-foreground">
				Are you sure you want to logout? You will need to sign in again to access your account.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer class="flex gap-3 sm:justify-end">
			<Button variant="outline" onclick={() => (showLogoutDialog = false)}>Cancel</Button>
			<form method="POST" action="?/logout" use:enhance>
				<Button type="submit" variant="destructive">
					<IconLogout class="mr-2 h-4 w-4" />
					Logout
				</Button>
			</form>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<Toaster position="top-right" richColors theme="dark" />
