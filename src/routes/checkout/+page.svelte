<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import { Badge } from '$lib/components/ui/badge';
	import {
		Check,
		ShieldCheck,
		Lock,
		ArrowLeft,
		Loader2,
		AlertCircle,
		Zap,
		CreditCard,
		Plus,
		CheckCircle2,
		Sparkles,
		Home
	} from '@lucide/svelte';
	import { loadStripe } from '@stripe/stripe-js';
	import { PUBLIC_STRIPE_KEY } from '$env/static/public';
	import { onMount, onDestroy, untrack } from 'svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import confetti from 'canvas-confetti';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const plan = $derived(data.plan);
	const user = $derived(data.user);
	const paymentMethods = $derived(data.paymentMethods || []);
	const features = $derived((plan.features as unknown as string[]) || []);

	let stripe: any = null;
	let elements: any = null;
	let cardElement: any = null;
	let cardError = $state('');
	let isProcessing = $state(false);
	let isSuccess = $state(false);
	let cardholderName = $state(untrack(() => user?.name || ''));

	let selectedPaymentMethodId = $state(
		untrack(() => (paymentMethods && paymentMethods.length > 0 ? paymentMethods[0].id : 'new'))
	);

	onMount(async () => {
		stripe = await loadStripe(PUBLIC_STRIPE_KEY);
		elements = stripe.elements();
		mountCardElement();
	});

	function mountCardElement() {
		if (!elements) return;
		if (selectedPaymentMethodId !== 'new') return;

		setTimeout(() => {
			if (document.querySelector('#card-element')) {
				const style = {
					base: {
						color: '#ffffff',
						fontFamily: 'system-ui, sans-serif',
						fontSmoothing: 'antialiased',
						fontSize: '14px',
						'::placeholder': {
							color: '#a1a1aa'
						}
					},
					invalid: {
						color: '#ef4444',
						iconColor: '#ef4444'
					}
				};

				if (!cardElement) {
					cardElement = elements.create('card', {
						style,
						hidePostalCode: true
					});
					cardElement.on('change', (event: any) => {
						if (event.error) {
							cardError = event.error.message;
						} else {
							cardError = '';
						}
					});
				}
				cardElement.mount('#card-element');
			}
		}, 100);
	}

	onDestroy(() => {
		if (cardElement) {
			try {
				cardElement.destroy();
				cardElement = null;
			} catch (e) {
				// Ignore if already destroyed or not mounted
			}
		}
	});

	$effect(() => {
		if (selectedPaymentMethodId === 'new') {
			mountCardElement();
		} else {
			if (cardElement) {
				cardElement.unmount();
			}
		}
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!stripe) return;

		isProcessing = true;
		cardError = '';

		try {
			let paymentMethodIdToUse = selectedPaymentMethodId;

			if (selectedPaymentMethodId === 'new') {
				if (!cardElement) return;
				const { paymentMethod, error } = await stripe.createPaymentMethod({
					type: 'card',
					card: cardElement,
					billing_details: {
						name: cardholderName,
						email: user.email
					}
				});

				if (error) throw new Error(error.message);
				paymentMethodIdToUse = paymentMethod.id;
			}

			// 2. Create Subscription
			const res = await fetch('/api/stripe/create-subscription', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					planId: plan.id,
					paymentMethodId: paymentMethodIdToUse
				})
			});

			const result = await res.json();
			if (!res.ok) throw new Error(result.error || 'Gagal memproses langganan');

			// 3. Handle Status
			if (result.status === 'active') {
				handleSuccess();
				return;
			}

			if (result.clientSecret) {
				const confirmResult = await stripe.confirmCardPayment(result.clientSecret);
				if (confirmResult.error) throw new Error(confirmResult.error.message);

				if (confirmResult.paymentIntent.status === 'succeeded') {
					handleSuccess();
				}
			} else {
				throw new Error('Pembayaran gagal atau membutuhkan konfirmasi manual.');
			}
		} catch (err: any) {
			console.error(err);
			cardError = err.message || 'Terjadi kesalahan saat memproses pembayaran.';
			toast.error(cardError);
		} finally {
			isProcessing = false;
		}
	}

	function handleSuccess() {
		isSuccess = true;
		invalidateAll();

		// Trigger confetti with delay for better effect
		setTimeout(() => {
			confetti({
				particleCount: 150,
				spread: 70,
				origin: { y: 0.6 },
				colors: ['#8b5cf6', '#d946ef', '#ffffff']
			});
		}, 300);

		// Second burst
		setTimeout(() => {
			confetti({
				particleCount: 100,
				spread: 100,
				origin: { y: 0.4 },
				colors: ['#22c55e', '#10b981', '#ffffff']
			});
		}, 600);
	}

	const formatPrice = (price: number) => {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(price);
	};
</script>

{#if isSuccess}
	<!-- Success Page -->
	<div class="flex min-h-screen items-center justify-center bg-background p-4">
		<div class="w-full max-w-lg text-center">
			<!-- Success Icon with animation -->
			<div class="relative mx-auto mb-8">
				<div
					class="mx-auto flex h-24 w-24 animate-in items-center justify-center rounded-full bg-linear-to-br from-green-400 to-emerald-600 shadow-lg shadow-green-500/30 duration-500 zoom-in-50"
				>
					<CheckCircle2 class="h-12 w-12 text-white" />
				</div>
				<div class="absolute -top-2 -right-2 animate-ping">
					<Sparkles class="h-8 w-8 text-amber-400" />
				</div>
			</div>

			<!-- Success Message -->
			<div class="animate-in delay-200 duration-500 fade-in-0 slide-in-from-bottom-4">
				<h1 class="mb-3 text-3xl font-bold tracking-tight text-foreground">
					Pembayaran Berhasil! 🎉
				</h1>
				<p class="mb-2 text-lg text-muted-foreground">
					Selamat datang di <span class="font-semibold text-primary">{plan.displayName}</span>
				</p>
				<p class="text-sm text-muted-foreground/80">
					Akun Anda telah diupgrade. Nikmati semua fitur premium!
				</p>
			</div>

			<!-- Plan Summary Card -->
			<div
				class="mx-auto mt-8 max-w-sm animate-in rounded-xl border bg-card p-6 shadow-lg delay-300 duration-500 fade-in-0 slide-in-from-bottom-6"
			>
				<div class="mb-4 flex items-center justify-between">
					<div class="flex items-center gap-2">
						<Zap class="h-5 w-5 fill-amber-400 text-amber-500" />
						<span class="font-semibold">{plan.displayName}</span>
					</div>
					<Badge variant="secondary" class="bg-green-500/10 text-green-600">Aktif</Badge>
				</div>
				<div class="space-y-2 text-left text-sm">
					<div class="flex items-center justify-between">
						<span class="text-muted-foreground">Total Pembayaran</span>
						<span class="font-medium">{formatPrice(plan.price)}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-muted-foreground">Credits</span>
						<span class="font-medium text-primary">{plan.credits} Credits</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-muted-foreground">Periode</span>
						<span class="font-medium">{plan.interval === 'month' ? 'Bulanan' : 'Tahunan'}</span>
					</div>
				</div>
			</div>

			<!-- Action Button -->
			<div class="mt-8 animate-in delay-500 duration-500 fade-in-0 slide-in-from-bottom-8">
				<Button href="/dashboard" size="lg" class="gap-2 text-base font-semibold">
					<Home class="h-5 w-5" />
					Kembali ke Dashboard
				</Button>
			</div>

			<p class="mt-6 text-xs text-muted-foreground/60">
				Konfirmasi pembayaran telah dikirim ke email Anda.
			</p>
		</div>
	</div>
{:else}
	<!-- Checkout Page -->
	<div class="min-h-screen bg-background pb-12">
		<div class="border-b bg-card py-4 shadow-sm">
			<div class="container mx-auto flex items-center px-4 md:px-6">
				<Button variant="ghost" size="sm" href="/dashboard/upgrade" class="gap-2">
					<ArrowLeft class="h-4 w-4" /> Kembali ke Paket
				</Button>
				<div class="mx-auto flex items-center gap-2 font-semibold">
					<ShieldCheck class="h-5 w-5 text-primary" />
					Checkout Aman
				</div>
				<div class="w-24"></div>
			</div>
		</div>

		<div class="container mx-auto mt-8 max-w-5xl px-4 md:px-6">
			<div class="grid gap-8 lg:grid-cols-12">
				<!-- Left Column: Order Summary (Shows on top on mobile) -->
				<div class="lg:order-2 lg:col-span-5">
					<div
						class="sticky top-8 overflow-hidden rounded-xl border bg-card shadow-lg ring-1 ring-border/50"
					>
						<!-- Header with Plan Name & Price -->
						<div class="bg-muted/30 p-6 pb-8">
							<div class="flex items-start justify-between">
								<div>
									<p class="text-sm font-medium text-muted-foreground">Paket Pilihan</p>
									<h3 class="mt-1 text-2xl font-bold tracking-tight text-primary">
										{plan.displayName}
									</h3>
								</div>
								<Badge variant="secondary" class="text-xs font-semibold tracking-wider uppercase">
									{plan.interval === 'month' ? 'Bulanan' : 'Tahunan'}
								</Badge>
							</div>
							<div class="mt-4 flex items-baseline gap-1">
								<span class="text-4xl font-extrabold tracking-tight">{formatPrice(plan.price)}</span
								>
								<span class="text-sm font-medium text-muted-foreground"
									>/{plan.interval === 'month' ? 'bln' : 'thn'}</span
								>
							</div>
							<div class="mt-2 flex items-center gap-2 text-sm text-foreground/80">
								<Zap class="h-4 w-4 fill-amber-400 text-amber-500" />
								<span class="font-medium">{plan.credits} Credits</span> per periode
							</div>
						</div>

						<!-- Divider with curve or nice separation -->
						<div class="relative -mt-4 px-6">
							<div
								class="absolute inset-0 top-0 h-4 bg-linear-to-b from-muted/30 to-transparent"
							></div>
							<div class="rounded-xl border bg-background p-4 shadow-sm">
								<p class="mb-3 text-xs font-semibold text-muted-foreground uppercase">
									Termasuk Fitur:
								</p>
								<div class="space-y-3">
									{#each features as feature}
										<div class="flex items-start gap-3 text-sm">
											<div class="mt-0.5 rounded-full bg-primary/10 p-1">
												<Check class="h-3 w-3 text-primary" />
											</div>
											<span class="text-foreground/90">{feature}</span>
										</div>
									{/each}
								</div>
							</div>
						</div>

						<!-- Total Footer -->
						<div class="p-6 pt-4">
							<div
								class="flex items-center justify-between rounded-lg bg-primary/5 p-4 ring-1 ring-primary/10"
							>
								<div>
									<p class="text-sm font-medium text-muted-foreground">Total Tagihan</p>
									<p class="text-opacity-80 text-xs text-muted-foreground">Segera dibayarkan</p>
								</div>
								<span class="text-xl font-bold text-primary">{formatPrice(plan.price)}</span>
							</div>
							<p class="mt-4 text-center text-[10px] leading-tight text-muted-foreground/60">
								Langganan diperbarui otomatis. Batalkan kapan saja di pengaturan billing.
							</p>
						</div>
					</div>
				</div>

				<!-- Right Column: Payment Form -->
				<div class="lg:order-1 lg:col-span-7">
					<div class="rounded-xl border bg-card p-6 shadow-sm md:p-8">
						<h2 class="mb-6 text-2xl font-bold">Informasi Pembayaran</h2>

						<form onsubmit={handleSubmit} class="space-y-6">
							<!-- Payment Method Selection -->
							{#if paymentMethods.length > 0}
								<div class="mb-6 grid gap-3">
									<Label>Pilih Metode Pembayaran</Label>
									{#each paymentMethods as pm}
										<label
											class="flex cursor-pointer items-center justify-between rounded-lg border p-4 hover:bg-accent/50 {selectedPaymentMethodId ===
											pm.id
												? 'border-primary bg-primary/5 ring-1 ring-primary'
												: 'border-border'} transition-all"
										>
											<div class="flex items-center gap-3">
												<input
													type="radio"
													name="paymentMethod"
													value={pm.id}
													bind:group={selectedPaymentMethodId}
													class="sr-only"
												/>
												<div class="rounded-md border bg-background p-2">
													<CreditCard class="h-5 w-5 text-muted-foreground" />
												</div>
												<div>
													<p class="flex items-center gap-2 text-sm font-medium">
														<span class="uppercase">{pm.card!.brand}</span>
														<span>•••• {pm.card!.last4}</span>
													</p>
													<p class="text-xs text-muted-foreground">
														Expires {pm.card!.exp_month}/{pm.card!.exp_year}
													</p>
												</div>
											</div>
											{#if selectedPaymentMethodId === pm.id}
												<div class="h-2.5 w-2.5 rounded-full bg-primary shadow-sm"></div>
											{/if}
										</label>
									{/each}

									<label
										class="flex cursor-pointer items-center justify-between rounded-lg border p-4 hover:bg-accent/50 {selectedPaymentMethodId ===
										'new'
											? 'border-primary bg-primary/5 ring-1 ring-primary'
											: 'border-border'} transition-all"
									>
										<div class="flex items-center gap-3">
											<input
												type="radio"
												name="paymentMethod"
												value="new"
												bind:group={selectedPaymentMethodId}
												class="sr-only"
											/>
											<div class="rounded-md border bg-background p-2">
												<Plus class="h-5 w-5 text-muted-foreground" />
											</div>
											<span class="text-sm font-medium">Gunakan Kartu Baru</span>
										</div>
										{#if selectedPaymentMethodId === 'new'}
											<div class="h-2.5 w-2.5 rounded-full bg-primary shadow-sm"></div>
										{/if}
									</label>
								</div>
							{/if}

							<!-- New Card Form -->
							{#if selectedPaymentMethodId === 'new'}
								<div class="animate-in space-y-6 duration-300 slide-in-from-top-2">
									<div class="space-y-2">
										<Label for="name">Nama Pemilik Kartu</Label>
										<Input
											id="name"
											bind:value={cardholderName}
											placeholder="Nama sesuai kartu"
											required
										/>
									</div>

									<div class="space-y-2">
										<Label>Detail Kartu</Label>
										<div
											class="rounded-md border bg-background px-3 py-3 ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
										>
											<div id="card-element"></div>
										</div>
										{#if cardError}
											<p class="mt-1 flex items-center gap-1 text-sm font-medium text-destructive">
												<AlertCircle class="h-3.5 w-3.5" />
												{cardError}
											</p>
										{/if}
									</div>
								</div>
							{/if}

							<div
								class="flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground"
							>
								<Lock class="h-4 w-4" />
								pembayaran Anda dienkripsi dan diproses dengan aman oleh Stripe.
							</div>

							<Button
								type="submit"
								size="lg"
								class="w-full text-base font-semibold"
								disabled={isProcessing}
							>
								{#if isProcessing}
									<Loader2 class="mr-2 h-5 w-5 animate-spin" /> Memproses Pembayaran...
								{:else}
									Bayar {formatPrice(plan.price)}
								{/if}
							</Button>
						</form>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
