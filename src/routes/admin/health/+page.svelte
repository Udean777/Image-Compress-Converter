<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';

	let { data } = $props();

	const statusColors = {
		online: 'bg-emerald-500',
		offline: 'bg-slate-400',
		error: 'bg-rose-500'
	};
</script>

<div class="space-y-6">
	<header>
		<h1 class="text-3xl font-bold tracking-tight text-foreground">System Health</h1>
		<p class="text-muted-foreground">Monitor the status of your platform services.</p>
	</header>

	<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
		{#each Object.entries(data.health) as [service, status]}
			<div class="rounded-xl border bg-card p-6 shadow-sm">
				<div class="flex items-center justify-between">
					<h3 class="font-semibold text-foreground capitalize">{service}</h3>
					<div class="flex items-center gap-2">
						<span
							class="h-2.5 w-2.5 rounded-full {statusColors[status as keyof typeof statusColors]}"
						></span>
						<Badge
							variant={status === 'online'
								? 'secondary'
								: status === 'error'
									? 'destructive'
									: 'outline'}
							class="uppercase"
						>
							{status}
						</Badge>
					</div>
				</div>
				<p class="mt-4 text-sm text-muted-foreground">
					{#if service === 'database'}
						PostgreSQL connection and query latency.
					{:else if service === 'storage'}
						MinIO/S3 bucket read/write accessibility.
					{:else if service === 'stripe'}
						Payment gateway API connectivity.
					{/if}
				</p>
			</div>
		{/each}
	</div>

	<div
		class="rounded-xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-900/30 dark:bg-blue-900/20"
	>
		<h3 class="font-semibold text-blue-900 dark:text-blue-300">Queue & Logs</h3>
		<p class="mt-2 text-sm text-blue-700 dark:text-blue-400">
			Background job processing and error logs integration is coming soon.
		</p>
	</div>
</div>
