<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar';
	import {
		IconDashboard,
		IconHistory,
		IconStar,
		IconSettings,
		IconImage,
		IconBilling,
		IconUser,
		IconSettings as IconActivity,
		IconHardDrive as IconStorage,
		IconBolt,
		IconCloud
	} from '$lib/components/icons';
	import { page } from '$app/stores';
	import SubscriptionWidget from './SubscriptionWidget.svelte';
	import { ArrowLeftRight } from '@lucide/svelte';

	let isAdminDashboard = $derived($page.url.pathname.startsWith('/admin'));

	let { user }: { user: any } = $props();

	const platformNav = [
		{ href: '/dashboard', label: 'Dashboard', icon: IconDashboard },
		{ href: '/dashboard/history', label: 'History', icon: IconHistory },
		{ href: '/dashboard/gallery', label: 'Gallery', icon: IconImage },
		{ href: '/dashboard/connectors', label: 'Connectors', icon: IconCloud }
	];

	const billingNav = [
		{ href: '/dashboard/upgrade', label: 'Upgrade', icon: IconStar },
		{ href: '/dashboard/billing', label: 'Billing', icon: IconBilling }
	];

	const settingsNav = $derived([
		{
			href: isAdminDashboard ? '/admin/settings' : '/dashboard/settings',
			label: 'Settings',
			icon: IconSettings
		}
	]);

	const adminNav = [
		{ href: '/admin', label: 'Overview', icon: IconDashboard },
		{ href: '/admin/activity', label: 'Activity Feed', icon: IconHistory },
		{ href: '/admin/pricing', label: 'Pricing Manager', icon: IconBilling },
		{ href: '/admin/users', label: 'Users Management', icon: IconUser },
		{ href: '/admin/storage', label: 'Storage Manager', icon: IconStorage },
		{ href: '/admin/maintenance', label: 'Maintenance', icon: IconBolt },
		{ href: '/admin/health', label: 'System Health', icon: IconActivity }
	];
</script>

<Sidebar.Root collapsible="icon">
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton
					size="lg"
					class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
				>
					<div
						class="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"
					>
						<IconImage class="size-4" />
					</div>
					<div class="grid flex-1 text-left text-sm leading-tight">
						<span class="truncate font-semibold">Image Studio</span>
					</div>
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>
	<Sidebar.Content>
		{#if isAdminDashboard}
			<Sidebar.Group>
				<Sidebar.GroupLabel>Administration</Sidebar.GroupLabel>
				<Sidebar.GroupContent>
					<Sidebar.Menu>
						{#each adminNav as item}
							{@const isActive =
								item.href === '/admin'
									? $page.url.pathname === '/admin'
									: $page.url.pathname.startsWith(item.href)}
							<Sidebar.MenuItem>
								<Sidebar.MenuButton {isActive}>
									{#snippet child({ props })}
										<a href={item.href} {...props}>
											<item.icon />
											<span>{item.label}</span>
										</a>
									{/snippet}
								</Sidebar.MenuButton>
							</Sidebar.MenuItem>
						{/each}
					</Sidebar.Menu>
				</Sidebar.GroupContent>
			</Sidebar.Group>
		{:else}
			<Sidebar.Group>
				<Sidebar.GroupLabel>Platform</Sidebar.GroupLabel>
				<Sidebar.GroupContent>
					<Sidebar.Menu>
						{#each platformNav as item}
							{@const isActive = $page.url.pathname === item.href}
							<Sidebar.MenuItem>
								<Sidebar.MenuButton {isActive}>
									{#snippet child({ props })}
										<a href={item.href} {...props}>
											<item.icon />
											<span>{item.label}</span>
										</a>
									{/snippet}
								</Sidebar.MenuButton>
							</Sidebar.MenuItem>
						{/each}
					</Sidebar.Menu>
				</Sidebar.GroupContent>
			</Sidebar.Group>

			<Sidebar.Group>
				<Sidebar.GroupLabel>Billing</Sidebar.GroupLabel>
				<Sidebar.GroupContent>
					<Sidebar.Menu>
						{#each billingNav as item}
							{@const isActive = $page.url.pathname === item.href}
							<Sidebar.MenuItem>
								<Sidebar.MenuButton {isActive}>
									{#snippet child({ props })}
										<a href={item.href} {...props}>
											<item.icon />
											<span>{item.label}</span>
										</a>
									{/snippet}
								</Sidebar.MenuButton>
							</Sidebar.MenuItem>
						{/each}
					</Sidebar.Menu>
				</Sidebar.GroupContent>
			</Sidebar.Group>
		{/if}

		{#if user?.role === 'ADMIN'}
			<Sidebar.Group>
				<Sidebar.GroupLabel>Actions</Sidebar.GroupLabel>
				<Sidebar.GroupContent>
					<Sidebar.Menu>
						<Sidebar.MenuItem>
							<Sidebar.MenuButton
								class="bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary"
							>
								{#snippet child({ props })}
									{#if isAdminDashboard}
										<a href="/dashboard" {...props}>
											<ArrowLeftRight class="size-4" />
											<span>Switch to User View</span>
										</a>
									{:else}
										<a href="/admin" {...props}>
											<ArrowLeftRight class="size-4" />
											<span>Switch to Admin Panel</span>
										</a>
									{/if}
								{/snippet}
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
					</Sidebar.Menu>
				</Sidebar.GroupContent>
			</Sidebar.Group>
		{/if}

		<Sidebar.Group>
			<Sidebar.GroupLabel>Account</Sidebar.GroupLabel>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					{#each settingsNav as item}
						{@const isActive = $page.url.pathname === item.href}
						<Sidebar.MenuItem>
							<Sidebar.MenuButton {isActive}>
								{#snippet child({ props })}
									<a href={item.href} {...props}>
										<item.icon />
										<span>{item.label}</span>
									</a>
								{/snippet}
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
					{/each}
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
	</Sidebar.Content>

	<Sidebar.Footer>
		<Sidebar.Menu>
			<SubscriptionWidget {user} />
		</Sidebar.Menu>
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>
