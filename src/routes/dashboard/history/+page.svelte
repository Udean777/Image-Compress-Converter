<script lang="ts">
	import type { PageProps } from './$types';
	import { IconClock } from '$lib/components/icons';
	import HistoryTable from '$lib/components/dashboard/history/HistoryTable.svelte';
	import HistoryBulkActions from '$lib/components/dashboard/history/HistoryBulkActions.svelte';
	import HistoryEmptyState from '$lib/components/dashboard/history/HistoryEmptyState.svelte';

	let { data }: PageProps = $props();
	let selectedIds = $state<string[]>([]);
</script>

<div class="space-y-6">
	<header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div class="flex w-full items-center justify-between gap-3">
			<div class="flex items-center gap-3">
				<div
					class="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30"
				>
					<IconClock class="h-6 w-6 text-primary-foreground" />
				</div>
				<div>
					<h1 class="text-2xl font-bold text-foreground">History</h1>
					<p class="text-muted-foreground">All your image transformations</p>
				</div>
			</div>

			<HistoryBulkActions bind:selectedIds {data} />
		</div>
	</header>

	{#if data.history && data.history.length > 0}
		<HistoryTable history={data.history} bind:selectedIds />
	{:else}
		<HistoryEmptyState />
	{/if}
</div>
