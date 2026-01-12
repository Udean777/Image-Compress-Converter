<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Download, ImageIcon } from '@lucide/svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<div class="flex flex-col gap-6 p-6">
	<div>
		<h1 class="text-3xl font-bold tracking-tight">My Gallery</h1>
		<p class="text-muted-foreground">koleksi permanen dari semua gambar yang telah Anda proses.</p>
	</div>

	{#if data.history.length === 0}
		<div
			class="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center"
		>
			<div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
				<ImageIcon class="h-8 w-8 text-muted-foreground" />
			</div>
			<h3 class="text-lg font-semibold">Galeri Kosong</h3>
			<p class="text-sm text-muted-foreground">Belum ada gambar yang tersimpan.</p>
			<Button class="mt-4" href="/dashboard">Mulai Proses Gambar</Button>
		</div>
	{:else}
		<div class="columns-2 gap-4 space-y-4 md:columns-3 lg:columns-4">
			{#each data.history as item}
				<div
					class="relative break-inside-avoid overflow-hidden rounded-xl border bg-card p-2 shadow-sm transition-all hover:shadow-md"
				>
					<img
						src={item.outputUrl}
						alt="Gallery Item"
						class="h-auto w-full max-w-full rounded-lg bg-muted object-cover"
						loading="lazy"
					/>

					<div class="mt-2 flex items-center justify-between px-1">
						<Badge variant="outline" class="font-mono text-[10px] uppercase"
							>{item.outputFormat}</Badge
						>
						<Button size="icon" variant="ghost" class="h-8 w-8" href={item.outputUrl} download>
							<Download class="h-4 w-4" />
						</Button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
