<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar';
	import {
		IconDashboard,
		IconHistory,
		IconSettings,
		IconStar,
		IconImage
	} from '$lib/components/icons';
	import { page } from '$app/stores';

	let { credits }: { credits: number } = $props();

	const navItems = [
		{ href: '/dashboard', label: 'Dashboard', icon: IconDashboard },
		{ href: '/dashboard/history', label: 'History', icon: IconHistory },
		{ href: '/dashboard/settings', label: 'Settings', icon: IconSettings }
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
						<!-- <span class="truncate text-xs">Vivnio</span> -->
					</div>
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>
	<Sidebar.Content>
		<Sidebar.Group>
			<Sidebar.GroupLabel>Platform</Sidebar.GroupLabel>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					{#each navItems as item}
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
			<Sidebar.MenuItem>
				<div
					class="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2 text-amber-600 transition-all group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0 dark:text-amber-400"
				>
					<IconStar class="size-4 shrink-0" />
					<span class="text-sm font-medium group-data-[collapsible=icon]:hidden">
						{credits} Credits
					</span>
				</div>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>
