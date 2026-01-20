<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { Badge } from '$lib/components/ui/badge';
	import {
		CreditCard,
		Download,
		Filter,
		ArrowRight,
		ArrowLeft,
		Search,
		TrendingUp,
		TrendingDown
	} from '@lucide/svelte';
	import { format } from 'date-fns';
	import { page as pageStore } from '$app/stores';
	import { goto } from '$app/navigation';

	interface Props {
		data: any;
		form: any;
	}

	let { data, form }: Props = $props();
	let transactions = $derived(data.transactions);

	let userIdFilter = $state($pageStore.url.searchParams.get('userId') || '');
	let typeFilter = $state($pageStore.url.searchParams.get('type') || 'all');

	function applyFilters() {
		const url = new URL($pageStore.url);
		if (userIdFilter) url.searchParams.set('userId', userIdFilter);
		else url.searchParams.delete('userId');

		if (typeFilter !== 'all') url.searchParams.set('type', typeFilter);
		else url.searchParams.delete('type');

		url.searchParams.set('page', '1');
		goto(url.toString());
	}

	function changePage(p: number) {
		const url = new URL($pageStore.url);
		url.searchParams.set('page', p.toString());
		goto(url.toString());
	}

	function handleExport(exportData: string, fileName: string) {
		const blob = new Blob([exportData], { type: 'text/csv' });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.setAttribute('hidden', '');
		a.setAttribute('href', url);
		a.setAttribute('download', fileName);
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	}

	$effect(() => {
		if (form?.exportData) {
			handleExport(form.exportData, form.fileName);
		}
	});

	const transactionTypes = [
		{ value: 'all', label: 'All Types' },
		{ value: 'subscription_renew', label: 'Subscription' },
		{ value: 'bonus', label: 'Bonus' },
		{ value: 'spend', label: 'Spend' },
		{ value: 'manual', label: 'Manual' }
	];
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-3xl font-bold tracking-tight text-foreground">Transaction Logs</h2>
			<p class="text-sm text-muted-foreground">Audit trail for all credit movements</p>
		</div>
		<form method="POST" action="?/export" use:enhance>
			<Button variant="outline" class="gap-2 shadow-sm transition-all hover:bg-muted" type="submit">
				<Download class="size-4" /> Export CSV
			</Button>
		</form>
	</div>

	<!-- Filters -->
	<div class="grid items-end gap-4 rounded-2xl border bg-card p-5 shadow-sm md:grid-cols-4">
		<div class="space-y-2">
			<Label class="text-xs font-semibold tracking-wider text-muted-foreground/70 uppercase"
				>User ID / Email</Label
			>
			<div class="relative">
				<Search class="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
				<Input
					placeholder="Search user..."
					bind:value={userIdFilter}
					class="bg-muted/30 pl-9 focus-visible:ring-primary"
				/>
			</div>
		</div>
		<div class="space-y-2">
			<Label class="text-xs font-semibold tracking-wider text-muted-foreground/70 uppercase"
				>Type</Label
			>
			<Select.Root type="single" bind:value={typeFilter}>
				<Select.Trigger class="w-full bg-muted/30 capitalize">
					{transactionTypes.find((t) => t.value === typeFilter)?.label}
				</Select.Trigger>
				<Select.Content>
					{#each transactionTypes as t}
						<Select.Item value={t.value}>{t.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</div>
		<div class="flex gap-2 md:col-span-2">
			<Button onclick={applyFilters} class="flex-1 gap-2 shadow-sm shadow-primary/20">
				<Filter class="size-4" /> Apply Filters
			</Button>
			<Button
				variant="ghost"
				onclick={() => {
					userIdFilter = '';
					typeFilter = 'all';
					applyFilters();
				}}
				class="text-muted-foreground hover:text-foreground"
			>
				Reset
			</Button>
		</div>
	</div>

	<div class="overflow-hidden rounded-2xl border bg-card shadow-sm">
		<div class="overflow-x-auto">
			<table class="w-full border-collapse text-left text-sm">
				<thead>
					<tr class="border-b bg-muted/30">
						<th class="p-4 font-semibold text-muted-foreground">User</th>
						<th class="p-4 font-semibold text-muted-foreground">Type</th>
						<th class="p-4 font-semibold text-muted-foreground">Amount</th>
						<th class="p-4 font-semibold text-muted-foreground">Description</th>
						<th class="p-4 font-semibold text-muted-foreground">Date</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-border/50">
					{#each transactions as t}
						<tr class="transition-colors hover:bg-muted/30">
							<td class="p-4">
								<div class="flex flex-col">
									<span class="font-bold text-foreground">{t.user?.name || 'Anonymous'}</span>
									<span class="text-xs text-muted-foreground">{t.user?.email}</span>
								</div>
							</td>
							<td class="p-4">
								<Badge variant="secondary" class="font-medium capitalize">{t.type}</Badge>
							</td>
							<td class="p-4">
								<div
									class="flex items-center gap-2 font-bold {t.amount >= 0
										? 'text-green-600 dark:text-green-400'
										: 'text-red-600 dark:text-red-400'}"
								>
									{#if t.amount >= 0}
										<TrendingUp class="size-4" />
										+{t.amount}
									{:else}
										<TrendingDown class="size-4" />
										{t.amount}
									{/if}
								</div>
							</td>
							<td class="max-w-xs truncate p-4 text-muted-foreground" title={t.description}>
								{t.description}
							</td>
							<td class="p-4">
								<div class="flex flex-col space-y-0.5 whitespace-nowrap">
									<span class="font-medium text-foreground"
										>{format(new Date(t.createdAt), 'MMM dd, yyyy')}</span
									>
									<span class="text-[10px] text-muted-foreground"
										>{format(new Date(t.createdAt), 'HH:mm:ss')}</span
									>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		{#if data.totalPages > 1}
			<div class="flex items-center justify-between border-t bg-muted/10 p-4">
				<p class="text-xs text-muted-foreground">
					Showing {(data.page - 1) * data.limit + 1} to {Math.min(
						data.page * data.limit,
						data.total
					)} of {data.total}
				</p>
				<div class="flex gap-2">
					<Button
						variant="outline"
						size="sm"
						disabled={data.page === 1}
						onclick={() => changePage(data.page - 1)}
						class="h-8 gap-1.5"
					>
						<ArrowLeft class="size-3.5" /> Previous
					</Button>
					<Button
						variant="outline"
						size="sm"
						disabled={data.page === data.totalPages}
						onclick={() => changePage(data.page + 1)}
						class="h-8 gap-1.5"
					>
						Next <ArrowRight class="size-3.5" />
					</Button>
				</div>
			</div>
		{/if}
	</div>
</div>
