<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { CreditCard, Receipt, ExternalLink, Zap } from '@lucide/svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const { activeSubscription, payments } = $derived(data);

	const formatDate = (date: Date) => {
		return new Date(date).toLocaleDateString('id-ID', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	};

	const formatPrice = (amount: number) => {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(amount);
	};
</script>

<div class="flex flex-col gap-8 p-6">
	<div>
		<h1 class="text-3xl font-bold tracking-tight">Billing & Invoices</h1>
		<p class="text-muted-foreground">
			Kelola langganan, metode pembayaran, dan lihat riwayat tagihan Anda.
		</p>
	</div>

	<!-- Current Plan Section -->
	<div class="grid gap-6 md:grid-cols-2">
		<div class="rounded-2xl border bg-card p-6">
			<h3 class="mb-4 flex items-center gap-2 font-semibold">
				<Zap class="h-4 w-4 text-primary" /> Paket Saat Ini
			</h3>
			{#if activeSubscription}
				<div class="flex items-start justify-between">
					<div>
						<p class="text-2xl font-bold">{activeSubscription.plan.displayName}</p>
						<p class="text-sm text-muted-foreground">
							Masa aktif hingga {formatDate(activeSubscription.currentPeriodEnd)}
						</p>
					</div>
					<Badge variant="default" class="bg-green-500 hover:bg-green-600">Active</Badge>
				</div>
				<div class="mt-6 flex gap-3">
					<Button href="/dashboard/upgrade" size="sm">Ganti Paket</Button>
					<Button href="/api/stripe/portal" variant="outline" size="sm" class="gap-2">
						Kelola di Stripe <ExternalLink class="h-3 w-3" />
					</Button>
				</div>
			{:else}
				<p class="text-muted-foreground">Anda belum berlangganan paket berbayar.</p>
				<Button href="/dashboard/upgrade" class="mt-4">Pilih Paket</Button>
			{/if}
		</div>

		<div class="rounded-2xl border bg-card p-6">
			<h3 class="mb-4 flex items-center gap-2 font-semibold">
				<CreditCard class="h-4 w-4 text-primary" /> Metode Pembayaran
			</h3>
			<p class="mb-4 text-sm text-muted-foreground">
				Metode pembayaran Anda dikelola secara aman oleh Stripe.
			</p>
			<Button href="/api/stripe/portal" variant="outline" size="sm">
				Update Metode Pembayaran
			</Button>
		</div>
	</div>

	<!-- History Table -->
	<div class="overflow-hidden rounded-2xl border bg-card">
		<div class="border-b p-6">
			<h3 class="flex items-center gap-2 font-semibold">
				<Receipt class="h-4 w-4 text-primary" /> Riwayat Pembayaran
			</h3>
		</div>
		<div class="overflow-x-auto">
			<table class="w-full text-left text-sm">
				<thead class="bg-muted/50 text-muted-foreground">
					<tr>
						<th class="p-4 font-medium">Tanggal</th>
						<th class="p-4 font-medium">Order ID</th>
						<th class="p-4 font-medium">Jumlah</th>
						<th class="p-4 font-medium">Status</th>
						<th class="p-4 text-right font-medium">Aksi</th>
					</tr>
				</thead>
				<tbody class="divide-y">
					{#each payments as payment}
						<tr class="hover:bg-muted/30">
							<td class="p-4">{formatDate(payment.createdAt)}</td>
							<td class="p-4 font-mono text-xs">{payment.midtransOrderId}</td>
							<td class="p-4">{formatPrice(payment.amount)}</td>
							<td class="p-4">
								<Badge
									variant={payment.status === 'paid' ? 'default' : 'secondary'}
									class="text-[10px] uppercase"
								>
									{payment.status}
								</Badge>
							</td>
							<td class="p-4 text-right">
								<Button variant="ghost" size="sm" href="/api/stripe/portal">Detail</Button>
							</td>
						</tr>
					{/each}
					{#if payments.length === 0}
						<tr>
							<td colspan="5" class="p-8 text-center text-muted-foreground">
								Belum ada riwayat transaksi.
							</td>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>
	</div>
</div>
