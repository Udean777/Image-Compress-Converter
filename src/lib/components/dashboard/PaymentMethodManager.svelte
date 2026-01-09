<script lang="ts">
	import { onMount, tick } from 'svelte';
	import {
		loadStripe,
		type Stripe,
		type StripeElements,
		type StripeCardElement,
		type PaymentMethod
	} from '@stripe/stripe-js';
	import { PUBLIC_STRIPE_KEY } from '$env/static/public';
	import { Button } from '$lib/components/ui/button';
	import { CreditCard, Trash2, Plus, Loader2 } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import * as Dialog from '$lib/components/ui/dialog';

	let stripe: Stripe | null = null;
	let elements: StripeElements | null = null;
	let cardElement: StripeCardElement | null = null;
	let loading = $state(true);
	let submitting = $state(false);
	let isAddDialogOpen = $state(false);
	let isDeleteDialogOpen = $state(false);
	let methodToDelete = $state<string | null>(null);
	let paymentMethods = $state<PaymentMethod[]>([]);
	let clientSecret = '';

	async function fetchMethods() {
		const res = await fetch('/api/stripe/payment-methods');
		paymentMethods = await res.json();
		loading = false;
	}

	async function initStripe() {
		if (stripe) return; // Prevent double init
		stripe = await loadStripe(PUBLIC_STRIPE_KEY);
		const res = await fetch('/api/stripe/setup-intent', { method: 'POST' });
		const data = await res.json();
		clientSecret = data.clientSecret;

		elements = stripe!.elements({ clientSecret });
		cardElement = elements.create('card', {
			style: { base: { fontSize: '16px', color: '#424770' } }
		});
		if (cardElement) cardElement.mount('#card-element');
	}

	async function handleAddCard() {
		submitting = true;
		const { error } = await stripe!.confirmCardSetup(clientSecret, {
			payment_method: { card: cardElement! }
		});

		if (error) {
			toast.error(error.message || 'Terjadi kesalahan');
		} else {
			toast.success('Kartu berhasil ditambahkan!');
			isAddDialogOpen = false;
			fetchMethods();
		}
		submitting = false;
	}

	async function confirmDelete(id: string) {
		methodToDelete = id;
		isDeleteDialogOpen = true;
	}

	async function handleDelete() {
		if (!methodToDelete) return;
		submitting = true;
		const res = await fetch(`/api/stripe/payment-methods?id=${methodToDelete}`, {
			method: 'DELETE'
		});
		if (res.ok) {
			toast.success('Kartu dihapus');
			fetchMethods();
			isDeleteDialogOpen = false;
		}
		submitting = false;
		methodToDelete = null;
	}

	onMount(fetchMethods);

	// Initialize Stripe when add dialog opens
	$effect(() => {
		if (isAddDialogOpen) {
			tick().then(() => initStripe());
		}
	});
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h3 class="flex items-center gap-2 text-lg font-semibold">
			<CreditCard class="h-5 w-5 text-primary" /> Metode Pembayaran
		</h3>

		<Dialog.Root bind:open={isAddDialogOpen}>
			<Dialog.Trigger>
				<Button variant="outline" size="sm">
					<Plus class="mr-2 h-4 w-4" /> Tambah Kartu
				</Button>
			</Dialog.Trigger>
			<Dialog.Content class="border-border bg-background sm:max-w-md">
				<Dialog.Header>
					<Dialog.Title>Tambah Kartu Baru</Dialog.Title>
					<Dialog.Description>
						Simpan kartu pembayaran Anda dengan aman untuk proses checkout yang lebih cepat.
					</Dialog.Description>
				</Dialog.Header>
				<div class="py-4">
					<div id="card-element" class="rounded-xl border bg-background p-3"></div>
				</div>
				<Dialog.Footer>
					<Button variant="ghost" onclick={() => (isAddDialogOpen = false)}>Batal</Button>
					<Button disabled={submitting} onclick={handleAddCard} class="min-w-30">
						{#if submitting}
							<Loader2 class="mr-2 h-4 w-4 animate-spin" /> ...
						{:else}
							Simpan Kartu
						{/if}
					</Button>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Root>
	</div>

	<div class="grid gap-3">
		{#if loading}
			<p class="animate-pulse text-sm text-muted-foreground">Memuat kartu...</p>
		{:else if paymentMethods.length === 0}
			<p class="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
				Belum ada kartu tersimpan.
			</p>
		{:else}
			{#each paymentMethods as pm}
				<div
					class="flex items-center justify-between rounded-xl border bg-card p-4 transition-colors hover:bg-accent/10"
				>
					<div class="flex items-center gap-4">
						<div
							class="w-12 rounded-lg bg-primary/10 p-2 text-center text-xs font-bold text-primary uppercase"
						>
							{pm.card?.brand || 'Card'}
						</div>
						<div>
							<p class="font-medium">•••• •••• •••• {pm.card?.last4 || '****'}</p>
							<p class="text-xs text-muted-foreground uppercase">
								Exp: {pm.card?.exp_month}/{pm.card?.exp_year}
							</p>
						</div>
					</div>
					<Button variant="ghost" size="icon" onclick={() => confirmDelete(pm.id)}>
						<Trash2 class="h-4 w-4 text-destructive" />
					</Button>
				</div>
			{/each}
		{/if}
	</div>

	<!-- Delete Confirmation Dialog -->
	<Dialog.Root bind:open={isDeleteDialogOpen}>
		<Dialog.Content class="border-border bg-background sm:max-w-md">
			<Dialog.Header>
				<Dialog.Title class="text-destructive">Hapus Kartu</Dialog.Title>
				<Dialog.Description>
					Apakah Anda yakin ingin menghapus metode pembayaran ini? Tindakan ini tidak dapat
					dibatalkan.
				</Dialog.Description>
			</Dialog.Header>
			<Dialog.Footer class="mt-4">
				<Button variant="ghost" onclick={() => (isDeleteDialogOpen = false)}>Kembali</Button>
				<Button variant="destructive" onclick={handleDelete} disabled={submitting}>
					{#if submitting}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					{/if}
					Hapus Kartu
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
</div>
