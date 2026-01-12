<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Receipt, Zap, AlertCircle } from '@lucide/svelte';
	import type { PageProps } from './$types';
	import type { SubscriptionWithPlan } from '$lib/server/services/SubscriptionService';
	import PaymentMethodManager from '$lib/components/dashboard/PaymentMethodManager.svelte';
	import * as Dialog from '$lib/components/ui/dialog';

	let { data }: PageProps = $props();
	const { payments } = $derived(data);
	const activeSubscription = $derived(data.activeSubscription as SubscriptionWithPlan | null);

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
							{activeSubscription.status === 'cancelled'
								? 'Akses Berakhir Pada'
								: 'Masa aktif hingga'}
							{formatDate(activeSubscription.currentPeriodEnd)}
						</p>
					</div>
					<Badge
						variant={activeSubscription.status === 'cancelled' ? 'secondary' : 'default'}
						class={activeSubscription.status === 'cancelled'
							? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
							: 'bg-green-500 hover:bg-green-600'}
					>
						{activeSubscription.status === 'cancelled' ? 'Cancelled' : 'Active'}
					</Badge>
				</div>
				<div class="mt-6 flex flex-wrap gap-3">
					<Button href="/dashboard/upgrade" size="sm">Ganti Paket</Button>

					{#if activeSubscription.status !== 'cancelled'}
						<Dialog.Root>
							<Dialog.Trigger>
								<Button variant="destructive" size="sm">Batalkan Langganan</Button>
							</Dialog.Trigger>
							<Dialog.Content class="border-border bg-background">
								<Dialog.Header>
									<Dialog.Title class="text-xl font-semibold text-destructive">
										Batalkan Langganan
									</Dialog.Title>
									<Dialog.Description class="text-muted-foreground">
										Apakah Anda yakin ingin membatalkan langganan? Anda akan tetap memiliki akses
										hingga akhir periode penagihan saat ini pada {formatDate(
											activeSubscription.currentPeriodEnd
										)}.
									</Dialog.Description>
								</Dialog.Header>
								<Dialog.Footer>
									<Dialog.Close>
										<Button variant="ghost">Kembali</Button>
									</Dialog.Close>
									<form method="POST" action="?/cancel">
										<Button type="submit" variant="destructive" class="w-full sm:w-auto">
											Ya, Batalkan Langganan
										</Button>
									</form>
								</Dialog.Footer>
							</Dialog.Content>
						</Dialog.Root>
					{:else}
						<div class="flex items-center gap-2 text-sm font-medium text-amber-600">
							<AlertCircle class="h-4 w-4" />
							Berlangganan dihentikan (Akan berakhir pada {formatDate(
								activeSubscription.currentPeriodEnd
							)})
						</div>
					{/if}
				</div>
			{:else}
				<p class="text-muted-foreground">Anda belum berlangganan paket berbayar.</p>
				<Button href="/dashboard/upgrade" class="mt-4">Pilih Paket</Button>
			{/if}
		</div>

		<div class="rounded-2xl border bg-card p-6">
			<PaymentMethodManager />
		</div>
	</div>

	<div class="grid gap-8 lg:grid-cols-2">
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
							<th class="p-4 font-medium">Jumlah</th>
							<th class="p-4 font-medium">Status</th>
							<th class="p-4 text-right font-medium">Aksi</th>
						</tr>
					</thead>
					<tbody class="divide-y">
						{#each payments as payment}
							<tr class="hover:bg-muted/30">
								<td class="p-4 font-medium">{formatDate(payment.createdAt)}</td>
								<td class="p-4">{formatPrice(payment.amount)}</td>
								<td class="p-4">
									<Badge
										variant={payment.status === 'paid' ? 'default' : 'secondary'}
										class="text-[10px] font-bold uppercase"
									>
										{payment.status}
									</Badge>
								</td>
								<td class="p-4 text-right">
									<Button variant="ghost" size="sm" href="/dashboard/billing/invoice/{payment.id}"
										>Detail</Button
									>
								</td>
							</tr>
						{/each}
						{#if payments.length === 0}
							<tr>
								<td colspan="4" class="p-8 text-center text-muted-foreground">
									Belum ada riwayat transaksi.
								</td>
							</tr>
						{/if}
					</tbody>
				</table>
			</div>
		</div>

		<div class="overflow-hidden rounded-2xl border bg-card">
			<div class="border-b p-6">
				<h3 class="flex items-center gap-2 font-semibold">
					<Zap class="h-4 w-4 text-primary" /> Riwayat Kredit
				</h3>
			</div>
			<div class="overflow-x-auto">
				<table class="w-full text-left text-sm">
					<thead class="bg-muted/50 text-muted-foreground">
						<tr>
							<th class="p-4 font-medium">Tanggal</th>
							<th class="p-4 font-medium">Aktivitas</th>
							<th class="p-4 text-right font-medium">Jumlah</th>
						</tr>
					</thead>
					<tbody class="divide-y">
						{#each data.creditTransactions || [] as tx}
							<tr class="hover:bg-muted/30">
								<td class="p-4 text-muted-foreground">{formatDate(tx.createdAt)}</td>
								<td class="p-4">
									<p class="font-medium">
										{#if tx.type === 'subscription_renew'}
											Langganan
										{:else if tx.type === 'usage'}
											Pemakaian
										{:else if tx.type === 'expired'}
											Kadaluarsa
										{:else}
											{tx.type}
										{/if}
									</p>
									<p class="max-w-37.5 truncate text-xs text-muted-foreground italic">
										{tx.description}
									</p>
								</td>
								<td class="p-4 text-right font-bold">
									<span class={tx.amount > 0 ? 'text-green-500' : 'text-foreground'}>
										{tx.amount > 0 ? '+' : ''}{tx.amount}
									</span>
								</td>
							</tr>
						{/each}
						{#if !data.creditTransactions || data.creditTransactions.length === 0}
							<tr>
								<td colspan="3" class="p-8 text-center text-muted-foreground">
									Belum ada riwayat kredit.
								</td>
							</tr>
						{/if}
					</tbody>
				</table>
			</div>
		</div>
	</div>
</div>
