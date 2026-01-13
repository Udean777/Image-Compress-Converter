<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';

	let { data } = $props();

	const getBadgeVariant = (type: string) => {
		switch (type) {
			case 'REMOVE_BG':
				return 'destructive';
			case 'COMPRESS':
				return 'secondary';
			case 'RESIZE':
				return 'outline';
			case 'CONVERT':
				return 'default';
			default:
				return 'outline';
		}
	};
</script>

<div class="space-y-6">
	<header>
		<h1 class="text-3xl font-bold tracking-tight text-foreground">Global Activity</h1>
		<p class="text-muted-foreground">Monitoring real-time image processing tasks.</p>
	</header>

	<div class="rounded-xl border bg-card shadow-sm">
		<div class="overflow-x-auto p-0">
			<table class="w-full text-left text-sm">
				<thead class="bg-muted/40 text-muted-foreground">
					<tr>
						<th class="p-4 font-medium">User</th>
						<th class="p-4 font-medium">Process</th>
						<th class="p-4 font-medium">Original Name</th>
						<th class="p-4 font-medium">Credits</th>
						<th class="p-4 font-medium">Time</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-border">
					{#each data.activity as item}
						<tr class="transition-colors hover:bg-muted/5">
							<td class="p-4">
								<div class="flex flex-col">
									<span class="font-medium text-foreground">{item.user.name || 'Anonymous'}</span>
									<span class="text-xs text-muted-foreground">{item.user.email}</span>
								</div>
							</td>
							<td class="p-4">
								<Badge variant={getBadgeVariant(item.action)}>
									{item.action.replace('_', ' ')}
								</Badge>
							</td>
							<td class="max-w-50 truncate p-4 text-muted-foreground" title={item.fileName}>
								{item.fileName}
							</td>
							<td class="p-4">
								<span class="font-mono text-rose-500">-{item.creditsUsed}</span>
							</td>
							<td class="p-4 whitespace-nowrap text-muted-foreground">
								{new Date(item.createdAt).toLocaleString()}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
