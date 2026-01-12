<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft, Download, Printer } from '@lucide/svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const payment = $derived(data.payment);
	const subscription = $derived(data.subscription);

	const formatDate = (date: Date | string) => {
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

	const invoiceNumber = $derived(`INV-${payment.id.slice(0, 8).toUpperCase()}`);

	function handlePrint() {
		window.print();
	}
</script>

<svelte:head>
	<title>Invoice {invoiceNumber} - Vivnio</title>
</svelte:head>

<div class="invoice-print-wrapper">
	<div class="mx-auto max-w-4xl p-4 print:hidden">
		<div class="flex items-center justify-between">
			<Button variant="ghost" size="sm" href="/dashboard/billing" class="gap-2">
				<ArrowLeft class="h-4 w-4" /> Kembali
			</Button>
			<Button variant="default" size="sm" class="gap-2" onclick={handlePrint}>
				<Printer class="h-4 w-4" /> Cetak Invoice
			</Button>
		</div>
	</div>

	<div
		class="invoice-container mx-auto max-w-4xl bg-white p-8 print:m-0 print:max-w-none print:p-0"
	>
		<div
			class="invoice-page rounded-lg border bg-white p-10 shadow-sm print:border-0 print:shadow-none"
		>
			<div class="invoice-header mb-10 flex items-start justify-between">
				<div>
					<h1 class="text-3xl font-bold text-gray-900">INVOICE</h1>
					<p class="mt-1 text-sm text-gray-500">No. {invoiceNumber}</p>
				</div>
				<div class="text-right">
					<div class="text-xl font-bold text-gray-900">Vivnio</div>
					<p class="mt-1 text-sm text-gray-500">Image Processing Platform</p>
					<p class="text-sm text-gray-500">support@vivnio.com</p>
				</div>
			</div>

			<div class="mb-10 grid grid-cols-2 gap-10">
				<div>
					<h3 class="mb-3 text-xs font-semibold tracking-wider text-gray-500 uppercase">
						Ditagihkan Kepada
					</h3>
					<div class="text-gray-900">
						<p class="font-semibold">{payment.user.name || 'Pelanggan'}</p>
						<p class="text-sm text-gray-600">{payment.user.email}</p>
					</div>
				</div>

				<div class="text-right">
					<div class="inline-block text-left">
						<table class="text-sm">
							<tbody>
								<tr>
									<td class="pr-6 text-gray-500">Tanggal Invoice</td>
									<td class="font-medium text-gray-900">{formatDate(payment.createdAt)}</td>
								</tr>
								{#if payment.paidAt}
									<tr>
										<td class="pt-1 pr-6 text-gray-500">Tanggal Bayar</td>
										<td class="pt-1 font-medium text-gray-900">{formatDate(payment.paidAt)}</td>
									</tr>
								{/if}
								<tr>
									<td class="pt-1 pr-6 text-gray-500">Status</td>
									<td class="pt-1">
										{#if payment.status === 'paid'}
											<span
												class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800"
											>
												LUNAS
											</span>
										{:else if payment.status === 'pending'}
											<span
												class="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800"
											>
												PENDING
											</span>
										{:else}
											<span
												class="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800"
											>
												GAGAL
											</span>
										{/if}
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			</div>

			<div class="mb-10">
				<table class="w-full">
					<thead>
						<tr class="border-b-2 border-gray-200">
							<th
								class="pb-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase"
							>
								Deskripsi
							</th>
							<th
								class="pb-3 text-center text-xs font-semibold tracking-wider text-gray-500 uppercase"
							>
								Periode
							</th>
							<th
								class="pb-3 text-center text-xs font-semibold tracking-wider text-gray-500 uppercase"
							>
								Qty
							</th>
							<th
								class="pb-3 text-right text-xs font-semibold tracking-wider text-gray-500 uppercase"
							>
								Harga
							</th>
							<th
								class="pb-3 text-right text-xs font-semibold tracking-wider text-gray-500 uppercase"
							>
								Jumlah
							</th>
						</tr>
					</thead>
					<tbody>
						<tr class="border-b border-gray-100">
							<td class="py-4">
								<div>
									<p class="font-medium text-gray-900">
										{subscription?.plan?.displayName || 'Paket Langganan'}
									</p>
									<p class="text-sm text-gray-500">
										{subscription?.plan?.credits || 0} Credits •
										{subscription?.plan?.interval === 'year' ? 'Tahunan' : 'Bulanan'}
									</p>
								</div>
							</td>
							<td class="py-4 text-center text-sm text-gray-600">
								{#if subscription}
									{formatDate(subscription.currentPeriodStart)} -<br />
									{formatDate(subscription.currentPeriodEnd)}
								{:else}
									-
								{/if}
							</td>
							<td class="py-4 text-center text-gray-900">1</td>
							<td class="py-4 text-right text-gray-900">{formatPrice(payment.amount)}</td>
							<td class="py-4 text-right font-medium text-gray-900"
								>{formatPrice(payment.amount)}</td
							>
						</tr>
					</tbody>
				</table>
			</div>

			<div class="mb-10 flex justify-end">
				<div class="w-72">
					<div class="space-y-2">
						<div class="flex justify-between text-sm">
							<span class="text-gray-500">Subtotal</span>
							<span class="text-gray-900">{formatPrice(payment.amount)}</span>
						</div>
						<div class="flex justify-between text-sm">
							<span class="text-gray-500">Pajak (Termasuk)</span>
							<span class="text-gray-900">Rp 0</span>
						</div>
						<div class="border-t border-gray-200 pt-2">
							<div class="flex justify-between">
								<span class="text-base font-semibold text-gray-900">Total</span>
								<span class="text-xl font-bold text-gray-900">{formatPrice(payment.amount)}</span>
							</div>
						</div>
					</div>

					{#if payment.status === 'paid'}
						<div class="mt-4 rounded-lg bg-green-50 p-3 text-center">
							<span class="text-sm font-medium text-green-700">✓ Pembayaran Diterima</span>
						</div>
					{/if}
				</div>
			</div>

			<div class="mb-10 rounded-lg bg-gray-50 p-6">
				<h3 class="mb-3 text-sm font-semibold text-gray-900">Informasi Pembayaran</h3>
				<div class="grid grid-cols-2 gap-4 text-sm">
					<div>
						<span class="text-gray-500">Metode Pembayaran:</span>
						<span class="ml-2 font-medium text-gray-900 capitalize">
							{payment.paymentType || 'Kartu Kredit'}
						</span>
					</div>
					<div>
						<span class="text-gray-500">ID Transaksi:</span>
						<span class="ml-2 font-mono text-xs text-gray-900">{payment.midtransOrderId}</span>
					</div>
				</div>
			</div>

			<div class="invoice-footer border-t border-gray-200 pt-6">
				<div class="text-center text-sm text-gray-500">
					<p>Terima kasih telah menggunakan layanan Vivnio.</p>
					<p class="mt-1">
						Jika ada pertanyaan tentang invoice ini, silakan hubungi
						<a href="mailto:support@vivnio.com" class="text-blue-600 hover:underline"
							>support@vivnio.com</a
						>
					</p>
				</div>
				<div class="mt-6 text-center text-xs text-gray-400">
					<p>Invoice ini dibuat secara otomatis dan sah tanpa tanda tangan.</p>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	@media print {
		:global(html),
		:global(body) {
			background: white !important;
			-webkit-print-color-adjust: exact !important;
			print-color-adjust: exact !important;
			margin: 0 !important;
			padding: 0 !important;
		}

		:global([data-sidebar]),
		:global([data-sidebar-rail]),
		:global(.sidebar-provider > aside),
		:global(.sidebar-inset > header) {
			display: none !important;
			visibility: hidden !important;
		}

		:global(.sidebar-inset),
		:global(main) {
			margin: 0 !important;
			padding: 0 !important;
			width: 100% !important;
			max-width: 100% !important;
		}

		.invoice-print-wrapper {
			position: absolute !important;
			top: 0 !important;
			left: 0 !important;
			right: 0 !important;
			width: 100% !important;
			background: white !important;
			z-index: 9999 !important;
		}

		.invoice-container {
			padding: 0 !important;
			margin: 0 auto !important;
			max-width: 100% !important;
			background: white !important;
		}

		.invoice-page {
			padding: 20px 40px !important;
			border: none !important;
			box-shadow: none !important;
			border-radius: 0 !important;
			background: white !important;
		}

		.invoice-page * {
			visibility: visible !important;
			color: #000 !important;
		}

		.invoice-page .text-gray-900,
		.invoice-page h1,
		.invoice-page .font-bold,
		.invoice-page .font-semibold,
		.invoice-page .font-medium {
			color: #111827 !important;
		}

		.invoice-page .text-gray-600 {
			color: #4b5563 !important;
		}

		.invoice-page .text-gray-500 {
			color: #6b7280 !important;
		}

		.invoice-page .text-gray-400 {
			color: #9ca3af !important;
		}

		.invoice-page .bg-green-100 {
			background-color: #dcfce7 !important;
		}
		.invoice-page .text-green-800 {
			color: #166534 !important;
		}
		.invoice-page .bg-green-50 {
			background-color: #f0fdf4 !important;
		}
		.invoice-page .text-green-700 {
			color: #15803d !important;
		}
		.invoice-page .bg-yellow-100 {
			background-color: #fef3c7 !important;
		}
		.invoice-page .text-yellow-800 {
			color: #92400e !important;
		}
		.invoice-page .bg-gray-50 {
			background-color: #f9fafb !important;
		}
		.invoice-page .text-blue-600 {
			color: #2563eb !important;
		}

		.invoice-page table {
			border-collapse: collapse !important;
		}
		.invoice-page th,
		.invoice-page td {
			border-color: #e5e7eb !important;
		}

		@page {
			size: A4;
			margin: 10mm;
		}
	}

	@media screen {
		.invoice-container {
			min-height: 100vh;
			padding-bottom: 2rem;
		}
	}
</style>
