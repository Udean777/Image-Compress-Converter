<script lang="ts">
	import { IconCheck, IconDownload } from '$lib/components/icons';
	import Compare from '$lib/components/Compare.svelte';
	import { formatBytes } from '$lib/format';
	import type { ProcessSuccess } from '$lib/types/image.types';

	interface Props {
		result: ProcessSuccess;
		originalUrl?: string;
	}

	let { result, originalUrl }: Props = $props();
</script>

<section
	class="animate-in rounded-3xl border border-emerald-500/30 bg-card p-4 shadow-sm duration-500 fade-in sm:p-6 md:p-8"
	aria-labelledby="success-title"
>
	<div class="mb-4 flex items-center gap-3">
		<div
			class="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/30"
		>
			<IconCheck class="h-6 w-6 text-white" />
		</div>
		<div>
			<h2 id="success-title" class="text-xl font-semibold text-foreground">Success!</h2>
			<p class="text-sm text-emerald-500">{result?.stats}</p>
		</div>
	</div>

	<div class="mb-4 grid grid-cols-2 gap-3 sm:gap-4">
		<div class="rounded-xl border border-border bg-muted/50 p-3">
			<p class="mb-1 text-xs tracking-wider text-muted-foreground uppercase">Original</p>
			<p class="font-medium text-foreground">{formatBytes(result?.originalSize ?? 0)}</p>
		</div>
		<div class="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
			<p class="mb-1 text-xs tracking-wider text-emerald-600 uppercase dark:text-emerald-400">
				Optimized
			</p>
			<p class="font-medium text-foreground">{formatBytes(result?.newSize ?? 0)}</p>
		</div>
	</div>

	<div class="mb-4 rounded-2xl bg-muted/50 p-4">
		<Compare
			firstImage={originalUrl}
			secondImage={result.url}
			firstImageClass="object-contain object-center"
			secondImageClass="object-contain object-center"
			class="h-62.5 w-full md:h-87.5"
			slideMode="hover"
		/>
	</div>

	<a
		href={result?.downloadUrl}
		download
		class="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:from-emerald-500 hover:to-teal-500 hover:shadow-emerald-500/50"
	>
		<IconDownload class="h-5 w-5" />
		Download Result
	</a>
</section>
