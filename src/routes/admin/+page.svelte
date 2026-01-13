<script lang="ts">
	import { onMount } from 'svelte';
	import {
		Chart as ChartJS,
		Title,
		Tooltip,
		Legend,
		LineElement,
		LinearScale,
		PointElement,
		CategoryScale,
		Filler,
		LineController
	} from 'chart.js';
	import { Users, Zap, TrendingUp, ArrowUpRight, ShieldPlus, Mail, Wallet } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Input } from '$lib/components/ui/input';
	import { toast } from 'svelte-sonner';
	import { enhance } from '$app/forms';

	ChartJS.register(
		Title,
		Tooltip,
		Legend,
		LineElement,
		LinearScale,
		PointElement,
		CategoryScale,
		Filler,
		LineController
	);

	let { data } = $props();

	let revenueCanvas: HTMLCanvasElement | undefined = $state();
	let userCanvas: HTMLCanvasElement | undefined = $state();
	let revenueChart: ChartJS | undefined;
	let userChart: ChartJS | undefined;

	let selectedUserIds = $state<string[]>([]);
	let bonusAmount = $state(50);
	let bonusDescription = $state('Loyalty Bonus');

	const formatPrice = (price: number) => {
		if (price === 0) return 'Free';
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(price);
	};

	const chartOptions = {
		responsive: true,
		maintainAspectRatio: false,
		scales: {
			y: { beginAtZero: true }
		},
		plugins: {
			legend: { display: false }
		}
	};

	function toggleUser(id: string) {
		selectedUserIds = selectedUserIds.includes(id)
			? selectedUserIds.filter((u) => u !== id)
			: [...selectedUserIds, id];
	}

	$effect(() => {
		if (revenueCanvas && data.revenueStats) {
			if (revenueChart) revenueChart.destroy();
			revenueChart = new ChartJS(revenueCanvas, {
				type: 'line',
				data: {
					labels: data.revenueStats.map((s: any) => s.date),
					datasets: [
						{
							label: 'Revenue (IDR)',
							fill: true,
							tension: 0.3,
							backgroundColor: 'rgba(16, 185, 129, 0.1)',
							borderColor: 'rgb(16, 185, 129)',
							pointBackgroundColor: 'rgb(16, 185, 129)',
							pointBorderColor: '#fff',
							data: data.revenueStats.map((s: any) => s.amount)
						}
					]
				},
				options: chartOptions
			});
		}

		if (userCanvas && data.userGrowth) {
			if (userChart) userChart.destroy();
			userChart = new ChartJS(userCanvas, {
				type: 'line',
				data: {
					labels: data.userGrowth.map((s: any) => s.date),
					datasets: [
						{
							label: 'New Users',
							fill: true,
							tension: 0.3,
							backgroundColor: 'rgba(59, 130, 246, 0.1)',
							borderColor: 'rgb(59, 130, 246)',
							pointBackgroundColor: 'rgb(59, 130, 246)',
							pointBorderColor: '#fff',
							data: data.userGrowth.map((s: any) => s.count)
						}
					]
				},
				options: chartOptions
			});
		}

		return () => {
			if (revenueChart) revenueChart.destroy();
			if (userChart) userChart.destroy();
		};
	});
</script>

<div class="mb-8 flex items-center justify-between">
	<h1 class="text-3xl font-bold tracking-tight">Platform Overview</h1>
	<div class="flex gap-2">
		<Badge variant="outline" class="gap-1 border-primary/20 bg-primary/5 px-3 py-1 text-primary">
			<Users class="size-3" />
			{data.stats.users} Users
		</Badge>
		<Badge
			variant="outline"
			class="gap-1 border-emerald-500/20 bg-emerald-500/5 px-3 py-1 text-emerald-600"
		>
			<Zap class="size-3" /> Premium Active
		</Badge>
	</div>
</div>

<div class="grid gap-6 md:grid-cols-3">
	<!-- Stat Cards -->
	<div class="group rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-md">
		<div class="flex items-start justify-between">
			<h3 class="text-sm font-medium text-muted-foreground">Total Users</h3>
			<div class="rounded-lg bg-primary/10 p-2 text-primary">
				<Users class="size-4" />
			</div>
		</div>
		<p class="mt-2 text-3xl font-bold tracking-tight">{data.stats.users}</p>
		<div class="mt-4 flex items-center gap-1 text-xs font-medium text-green-600">
			<TrendingUp class="size-3" /> 12% from last month
		</div>
	</div>
	<div class="group rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-md">
		<div class="flex items-start justify-between">
			<h3 class="text-sm font-medium text-muted-foreground">Total Revenue</h3>
			<div class="rounded-lg bg-emerald-500/10 p-2 text-emerald-600">
				<Wallet class="size-4" />
			</div>
		</div>
		<p class="mt-2 text-3xl font-bold tracking-tight text-emerald-600">
			{formatPrice(data.stats.revenue)}
		</p>
		<div class="mt-4 flex items-center gap-1 text-xs font-medium tracking-tight text-green-600">
			<ArrowUpRight class="size-3" /> Growing steadily
		</div>
	</div>
	<div class="group rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-md">
		<div class="flex items-start justify-between">
			<h3 class="text-sm font-medium text-muted-foreground">Studio Usage</h3>
			<div class="rounded-lg bg-blue-500/10 p-2 text-blue-600">
				<Zap class="size-4" />
			</div>
		</div>
		<p class="mt-2 text-3xl font-bold tracking-tight text-blue-600">{data.stats.images}</p>
		<div class="mt-4 flex items-center gap-1 text-xs font-medium text-muted-foreground">
			Total images processed
		</div>
	</div>
</div>

<!-- Charts Section -->
<div class="mt-8 grid gap-6 lg:grid-cols-2">
	<div class="rounded-2xl border bg-card p-6 shadow-sm">
		<div class="mb-4 flex items-center justify-between">
			<h3 class="font-bold text-foreground">Revenue Trend (30 Days)</h3>
			<Badge variant="secondary" class="border-none bg-emerald-500/10 text-emerald-600"
				>Live Data</Badge
			>
		</div>
		<div class="h-64">
			<canvas bind:this={revenueCanvas}></canvas>
		</div>
	</div>

	<div class="rounded-2xl border bg-card p-6 shadow-sm">
		<div class="mb-4 flex items-center justify-between">
			<h3 class="font-bold text-foreground">User Acquisition</h3>
			<Badge variant="secondary" class="border-none bg-blue-500/10 text-blue-600">New signups</Badge
			>
		</div>
		<div class="h-64">
			<canvas bind:this={userCanvas}></canvas>
		</div>
	</div>
</div>

<div class="mt-8 grid gap-6 lg:grid-cols-2">
	<!-- Top Consumers -->
	<div class="flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm">
		<div class="flex items-center justify-between border-b bg-muted/30 p-6">
			<div>
				<h3 class="font-bold">Top Power Users</h3>
				<p class="text-xs text-muted-foreground">Most active credit consumers</p>
			</div>
			<Button
				variant="outline"
				size="sm"
				onclick={() => {
					selectedUserIds = data.topConsumers.map((c: any) => c.userId);
				}}
			>
				Select All
			</Button>
		</div>
		<div class="flex-1">
			<table class="w-full text-left text-sm">
				<tbody class="divide-y divide-border/50">
					{#each data.topConsumers as consumer}
						<tr class="group transition-colors hover:bg-muted/30">
							<td class="p-4">
								<div class="flex items-center gap-3">
									<input
										type="checkbox"
										checked={selectedUserIds.includes(consumer.userId)}
										onchange={() => toggleUser(consumer.userId)}
										class="rounded border-muted-foreground/30 text-primary focus:ring-primary"
									/>
									<div class="flex flex-col">
										<span class="font-bold text-foreground"
											>{consumer.user?.name || 'Anonymous'}</span
										>
										<span class="text-xs text-muted-foreground">{consumer.user?.email}</span>
									</div>
								</div>
							</td>
							<td class="p-4 text-right">
								<div class="flex flex-col items-end">
									<span class="font-bold text-primary">{consumer._sum.creditsUsed} Credits</span>
									<span class="text-[10px] text-muted-foreground uppercase"
										>{consumer._count.id} Actions</span
									>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		{#if selectedUserIds.length > 0}
			<div class="border-t bg-primary/5 p-4">
				<div class="flex flex-col gap-3">
					<div class="flex items-center justify-between">
						<span class="text-xs font-bold text-primary"
							>{selectedUserIds.length} users selected</span
						>
						<Button
							variant="ghost"
							size="sm"
							class="h-7 text-xs"
							onclick={() => (selectedUserIds = [])}>Clear</Button
						>
					</div>
					<div class="flex gap-2">
						<Input type="number" bind:value={bonusAmount} class="h-9 text-xs" />
						<form
							method="POST"
							action="?/bulk_credits"
							use:enhance={() => {
								return async ({ result }) => {
									if (result.type === 'success') {
										toast.success(
											`Granted ${bonusAmount} credits to ${selectedUserIds.length} users`
										);
										selectedUserIds = [];
									}
								};
							}}
						>
							<input type="hidden" name="userIds" value={JSON.stringify(selectedUserIds)} />
							<input type="hidden" name="amount" value={bonusAmount} />
							<input type="hidden" name="description" value={bonusDescription} />
							<Button type="submit" size="sm" class="h-9 gap-2">
								<ShieldPlus class="size-3.5" /> Grant
							</Button>
						</form>
					</div>
				</div>
			</div>
		{/if}
	</div>

	<!-- Recent Users -->
	<div class="flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm">
		<div class="border-b bg-muted/30 p-6">
			<h3 class="font-bold">Recent Signups</h3>
			<p class="text-xs text-muted-foreground">Who joined recently</p>
		</div>
		<div class="flex-1 overflow-x-auto">
			<table class="w-full text-left text-sm">
				<tbody class="divide-y divide-border/50">
					{#each data.recentUsers as user}
						<tr class="transition-colors hover:bg-muted/30">
							<td class="p-4">
								<div class="flex items-center gap-3">
									<div
										class="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary"
									>
										{(user.name || user.email)[0].toUpperCase()}
									</div>
									<div class="flex flex-col">
										<span class="max-w-30 truncate font-bold text-foreground"
											>{user.name || 'Anonymous'}</span
										>
										<span class="max-w-30 truncate text-xs text-muted-foreground">{user.email}</span
										>
									</div>
								</div>
							</td>
							<td class="p-4">
								<Badge
									variant="secondary"
									class="border-none bg-muted font-mono text-[10px] text-muted-foreground uppercase"
								>
									{user.role}
								</Badge>
							</td>
							<td class="p-4 text-right text-xs text-muted-foreground">
								{new Date(user.createdAt).toLocaleDateString()}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<div class="border-t p-4 text-center">
			<Button
				variant="ghost"
				size="sm"
				href="/admin/users"
				class="text-xs text-muted-foreground hover:text-primary"
			>
				View All Users
			</Button>
		</div>
	</div>
</div>
