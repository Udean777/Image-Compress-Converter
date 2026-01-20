<script lang="ts">
	import type { PageProps } from './$types';
	import ProfileTab from '$lib/components/dashboard/settings/ProfileTab.svelte';
	import SecurityTab from '$lib/components/dashboard/settings/SecurityTab.svelte';

	let { data, form }: PageProps = $props();
	let activeTab = $state('profile');

	let user = $derived(form?.user ?? data.user);
</script>

<div class="space-y-6">
	<header>
		<h1 class="text-3xl font-bold text-foreground">Admin Settings</h1>
		<p class="mt-1 text-muted-foreground">Manage your administrative profile</p>
	</header>

	<div class="rounded-2xl border border-border bg-card shadow-sm">
		<div class="border-b border-border px-6 pt-4">
			<div class="flex gap-6">
				<button
					class="pb-4 text-sm font-medium transition-colors {activeTab === 'profile'
						? 'border-b-2 border-primary text-primary'
						: 'text-muted-foreground hover:text-foreground'}"
					onclick={() => (activeTab = 'profile')}
				>
					Profile
				</button>
				<button
					class="pb-4 text-sm font-medium transition-colors {activeTab === 'security'
						? 'border-b-2 border-primary text-primary'
						: 'text-muted-foreground hover:text-foreground'}"
					onclick={() => (activeTab = 'security')}
				>
					Security
				</button>
			</div>
		</div>

		<div class="p-6">
			{#if activeTab === 'profile'}
				<ProfileTab {user} />
			{:else if activeTab === 'security'}
				<SecurityTab />
			{/if}
		</div>
	</div>
</div>
