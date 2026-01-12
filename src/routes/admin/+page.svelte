<script lang="ts">
	let { data } = $props();

	const formatPrice = (price: number) => {
		if (price === 0) return 'Free';
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(price);
	};
</script>

<h1 class="mb-8 text-3xl font-bold tracking-tight">Platform Overview</h1>

<div class="grid gap-6 md:grid-cols-3">
	<!-- Stat Cards -->
	<div class="rounded-xl border bg-card p-6 shadow-sm">
		<h3 class="text-sm font-medium text-muted-foreground">Total Users</h3>
		<p class="mt-2 text-3xl font-bold">{data.stats.users}</p>
	</div>
	<div class="rounded-xl border bg-card p-6 shadow-sm">
		<h3 class="text-sm font-medium text-muted-foreground">Total Revenue</h3>
		<p class="mt-2 text-3xl font-bold text-emerald-600">{formatPrice(data.stats.revenue)}</p>
	</div>
	<div class="rounded-xl border bg-card p-6 shadow-sm">
		<h3 class="text-sm font-medium text-muted-foreground">Images Processed</h3>
		<p class="mt-2 text-3xl font-bold text-blue-600">{data.stats.images}</p>
	</div>
</div>

<!-- Recent Activity -->
<div class="mt-8 rounded-xl border bg-card">
	<div class="border-b p-6">
		<h3 class="font-semibold">Newest Members</h3>
	</div>
	<div class="p-6">
		<table class="w-full text-left text-sm">
			<thead>
				<tr class="text-muted-foreground">
					<th class="pb-3">Name</th>
					<th class="pb-3">Email</th>
					<th class="pb-3">Role</th>
					<th class="pb-3">Joined</th>
				</tr>
			</thead>
			<tbody class="divide-y">
				{#each data.recentUsers as user}
					<tr>
						<td class="py-3 font-medium">{user.name || 'No Name'}</td>
						<td class="py-3">{user.email}</td>
						<td class="py-3">
							<span class="rounded bg-muted px-2 py-1 font-mono text-xs">{user.role}</span>
						</td>
						<td class="py-3 text-muted-foreground"
							>{new Date(user.createdAt).toLocaleDateString()}</td
						>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
