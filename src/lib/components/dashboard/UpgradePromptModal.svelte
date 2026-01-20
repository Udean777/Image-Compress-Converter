<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Zap, AlertCircle } from '@lucide/svelte';

	let {
		open = $bindable(false),
		title = 'Credit Habis!',
		description = 'Anda telah menggunakan semua credit gratis Anda. Upgrade ke paket Pro untuk terus menggunakan fitur premium tanpa batas.'
	} = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-106.25">
		<div class="flex flex-col items-center justify-center pt-6 text-center">
			<div
				class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30"
			>
				<AlertCircle class="h-10 w-10 text-amber-600 dark:text-amber-400" />
			</div>
			<Dialog.Header>
				<Dialog.Title class="text-2xl font-bold">{title}</Dialog.Title>
				<Dialog.Description class="pt-2 text-base">
					{description}
				</Dialog.Description>
			</Dialog.Header>
		</div>
		<Dialog.Footer class="mt-6 gap-2 sm:justify-center">
			<Button variant="outline" onclick={() => (open = false)} class="w-full sm:w-auto"
				>Nanti Saja</Button
			>
			<Button href="/dashboard/upgrade" class="w-full gap-2 sm:w-auto">
				<Zap class="size-4 fill-current" /> Lihat Paket
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
