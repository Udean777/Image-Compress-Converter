<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Check, Zap, ArrowLeft, AlertCircle } from '@lucide/svelte';
	import type { PageProps } from './$types';
	import type { SubscriptionWithPlan } from '$lib/server/services/SubscriptionService';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';
	import confetti from 'canvas-confetti';

	import { loadStripe } from '@stripe/stripe-js';
	import { PUBLIC_STRIPE_KEY } from '$env/static/public';
	import * as Dialog from '$lib/components/ui/dialog';
	import { CreditCard, Loader2 } from '@lucide/svelte';

	let { data }: PageProps = $props();
	const { plans, paymentMethods } = $derived(data as any);
	const activeSubscription = $derived(data.activeSubscription as SubscriptionWithPlan | null);

	let selectedPlan: any = $state(null);
	let selectedPaymentMethodId = $state('');
	let isProcessing = $state(false);
	let showSavedCardDialog = $state(false);

	const tierLevels: Record<string, number> = {
		free: 0,
		starter: 1,
		pro: 2,
		business: 3
	};

	const currentTier = $derived(activeSubscription?.plan.name ?? 'free');
	const currentTierLevel = $derived(tierLevels[currentTier]);

	const formatPrice = (price: number) => {
		if (price === 0) return 'Gratis';
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(price);
	};

	async function handlePlanSelection(plan: any) {
		if (paymentMethods && paymentMethods.length > 0) {
			selectedPlan = plan;
			selectedPaymentMethodId = paymentMethods[0].id;
			showSavedCardDialog = true;
		} else {
			window.location.href = `/api/checkout?plan=${plan.id}`;
		}
	}

	async function handleQuickPay() {
		isProcessing = true;
		try {
			const res = await fetch('/api/stripe/subscribe-with-saved', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					planId: selectedPlan.id,
					paymentMethodId: selectedPaymentMethodId
				})
			});

			const result = await res.json();
			if (!res.ok) throw new Error(result.error || 'Gagal memproses pembayaran');

			if (result.clientSecret) {
				const stripe = await loadStripe(PUBLIC_STRIPE_KEY);
				const { error, paymentIntent } = await stripe!.confirmCardPayment(result.clientSecret);
				if (error) throw new Error(error.message);
				if (paymentIntent.status !== 'succeeded') {
					throw new Error('Pembayaran belum dikonfirmasi. Status: ' + paymentIntent.status);
				}
			}

			toast.success('Upgrade berhasil! Akun Anda sedang diperbarui.');
			confetti({
				particleCount: 150,
				spread: 70,
				origin: { y: 0.6 },
				colors: ['#8b5cf6', '#d946ef', '#ffffff']
			});
			showSavedCardDialog = false;

			// Tunggu sebentar agar webhook punya waktu memproses sebelum invalidate
			setTimeout(() => {
				invalidateAll();
			}, 1500);
		} catch (err: any) {
			toast.error(err.message);
		} finally {
			isProcessing = false;
		}
	}

	onMount(() => {
		const url = new URL(window.location.href);
		if (url.searchParams.get('success') === 'true') {
			confetti({
				particleCount: 150,
				spread: 70,
				origin: { y: 0.6 },
				colors: ['#8b5cf6', '#d946ef', '#ffffff']
			});
			toast.success('Pembayaran Berhasil!');

			invalidateAll();

			url.searchParams.delete('success');
			window.history.replaceState({}, '', url.pathname);
		}
	});
</script>

<div class="flex flex-col gap-8 p-6">
	<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
		<div class="space-y-4">
			<h1 class="text-3xl font-bold tracking-tight">Upgrade Plan</h1>
			{#if activeSubscription}
				<div
					class="mb-4 flex items-center justify-between space-x-2 rounded-xl border border-primary/20 bg-primary/5 p-4"
				>
					<div class="text-sm">
						Anda sedang berlangganan paket <span class="font-bold text-primary"
							>{activeSubscription.plan.displayName}</span
						>
					</div>
					<Button href="/dashboard/billing" variant="secondary" size="sm">
						Kelola Billing & Invoice
					</Button>
				</div>
			{/if}
			<p class="text-muted-foreground">Pilih paket yang sesuai dengan kebutuhan kreasi Anda.</p>
		</div>
		<Button variant="outline" href="/dashboard">
			<ArrowLeft class="mr-2 h-4 w-4" /> Kembali Dashboard
		</Button>
	</div>

	{#if activeSubscription}
		<div class="rounded-xl border border-primary/20 bg-primary/5 p-6 backdrop-blur-sm">
			<div class="flex items-center justify-between">
				<div class="space-y-1">
					<p class="text-sm font-medium text-primary">Paket Aktif Saat Ini</p>
					<h3 class="text-xl font-bold">{activeSubscription.plan.displayName}</h3>
					<p class="text-sm text-muted-foreground">
						{activeSubscription.status === 'cancelled' ? 'Akses berakhir pada' : 'Berakhir pada'}
						{new Date(activeSubscription.currentPeriodEnd).toLocaleDateString('id-ID')}
					</p>
					{#if activeSubscription.status === 'cancelled'}
						<div class="mt-2 flex items-center gap-1.5 text-xs font-medium text-amber-600">
							<AlertCircle class="h-3.5 w-3.5" />
							Langganan telah dibatalkan (Tidak akan diperpanjang)
						</div>
					{/if}
				</div>
				<Badge
					variant={activeSubscription.status === 'cancelled' ? 'secondary' : 'default'}
					class={activeSubscription.status === 'cancelled'
						? 'bg-amber-100 text-amber-700'
						: 'bg-primary px-4 py-1 text-sm'}
				>
					{activeSubscription.status === 'cancelled' ? 'Cancelled' : 'Active'}
				</Badge>
			</div>
		</div>
	{/if}

	<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
		{#each plans as plan}
			{@const isCurrentPlan = plan.isActive || (plan.name === 'free' && currentTier === 'free')}
			{@const isLowerTier = tierLevels[plan.name] < currentTierLevel && !isCurrentPlan}

			<div
				class="relative flex flex-col rounded-2xl border p-6 transition-all hover:shadow-lg
				{isCurrentPlan ? 'border-primary bg-primary/5' : 'border-border bg-card'}
				{isLowerTier ? 'opacity-75 grayscale-[0.5]' : ''}"
			>
				{#if plan.isPopular}
					<Badge class="absolute -top-3 right-6 bg-primary px-3 text-xs font-semibold uppercase">
						Populer
					</Badge>
				{/if}

				<div class="mb-6">
					<h3 class="text-lg font-bold">{plan.displayName}</h3>
					<div class="mt-2 flex items-baseline gap-1">
						<span class="text-3xl font-bold">{formatPrice(plan.price)}</span>
						{#if plan.interval !== 'once'}
							<span class="text-sm text-muted-foreground"
								>/{plan.interval === 'month' ? 'bln' : 'thn'}</span
							>
						{/if}
					</div>
					<p class="mt-2 text-xs text-muted-foreground">
						Dapatkan {plan.credits} credit tiap periode
					</p>
				</div>

				<ul class="mb-8 flex-1 space-y-3">
					{#each plan.features as feature}
						<li class="flex items-start gap-2 text-sm">
							<Check class="mt-0.5 h-4 w-4 shrink-0 text-primary" />
							<span class="text-muted-foreground">{feature}</span>
						</li>
					{/each}
				</ul>

				<Button
					disabled={isCurrentPlan || isLowerTier}
					variant={isCurrentPlan
						? 'outline'
						: isLowerTier
							? 'ghost'
							: plan.isPopular
								? 'default'
								: 'secondary'}
					class="w-full py-5 font-semibold"
					onclick={() => handlePlanSelection(plan)}
				>
					{#if isCurrentPlan}
						Paket Saat Ini
					{:else if isLowerTier}
						Tidak Bisa Downgrade Plan
					{:else}
						Pilih Paket <Zap class="ml-2 h-4 w-4 fill-current" />
					{/if}
				</Button>
			</div>
		{/each}
	</div>

	<div class="mt-4 rounded-lg bg-muted/50 p-4 text-center text-sm text-muted-foreground">
		Butuh bantuan memilih? <a
			href="mailto:support@imagestudio.com"
			class="font-medium text-primary hover:underline">Hubungi kami</a
		>
	</div>
</div>

<Dialog.Root bind:open={showSavedCardDialog}>
	<Dialog.Content class="sm:max-w-106.25">
		<Dialog.Header>
			<Dialog.Title>Gunakan Kartu Tersimpan?</Dialog.Title>
			<Dialog.Description>
				Konfirmasi pembelian paket <b>{selectedPlan?.displayName}</b> seharga
				<b>{formatPrice(selectedPlan?.price || 0)}</b>.
			</Dialog.Description>
		</Dialog.Header>
		<div class="grid gap-4 py-4">
			<div class="space-y-2">
				<p class="text-sm font-medium">Metode Pembayaran</p>
				<div class="grid gap-2">
					{#each paymentMethods || [] as pm}
						<label
							class="flex cursor-pointer items-center justify-between rounded-lg border p-3 hover:bg-accent/50 {selectedPaymentMethodId ===
							pm.id
								? 'border-primary bg-primary/5'
								: 'border-border'}"
						>
							<div class="flex items-center gap-3">
								<input
									type="radio"
									name="paymentMethod"
									value={pm.id}
									bind:group={selectedPaymentMethodId}
									class="sr-only"
								/>
								<CreditCard class="h-4 w-4 text-muted-foreground" />
								<div>
									<p class="text-sm font-medium uppercase">{pm.card.brand} •••• {pm.card.last4}</p>
									<p class="text-xs text-muted-foreground">
										Exp: {pm.card.exp_month}/{pm.card.exp_year}
									</p>
								</div>
							</div>
							{#if selectedPaymentMethodId === pm.id}
								<div class="h-2 w-2 rounded-full bg-primary"></div>
							{/if}
						</label>
					{/each}
				</div>
			</div>
			<Button variant="outline" class="w-full" href={`/api/checkout?plan=${selectedPlan?.id}`}>
				Gunakan Kartu Lain
			</Button>
		</div>
		<Dialog.Footer>
			<Button class="w-full" disabled={isProcessing} onclick={handleQuickPay}>
				{#if isProcessing}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" /> Memproses...
				{:else}
					Bayar Sekarang
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
