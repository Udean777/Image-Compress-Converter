<script lang="ts">
	import { IconCheck, IconDownload } from '$lib/components/icons';
	import { formatBytes } from '$lib/format';

	interface ProcessResultData {
		stats?: string;
		originalSize?: number;
		newSize?: number;
		url?: string;
		downloadUrl?: string;
	}

	interface Props {
		result: ProcessResultData;
	}

	let { result }: Props = $props();
</script>

<section
	class="animate-in rounded-3xl border border-emerald-500/30 bg-linear-to-br from-emerald-500/10 to-teal-500/10 p-6 shadow-2xl backdrop-blur-xl duration-500 fade-in md:p-8"
	aria-labelledby="success-title"
>
	<div class="mb-5 flex items-center gap-3">
		<div
			class="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30"
		>
			<IconCheck class="h-6 w-6 text-white" />
		</div>
		<div>
			<h2 id="success-title" class="text-xl font-semibold text-white">Success!</h2>
			<p class="text-sm text-emerald-300">{result?.stats}</p>
		</div>
	</div>

	<div class="mb-5 grid grid-cols-2 gap-4">
		<div class="rounded-xl border border-white/10 bg-white/5 p-3">
			<p class="mb-1 text-xs tracking-wider text-slate-400 uppercase">Original</p>
			<p class="font-medium text-white">{formatBytes(result?.originalSize ?? 0)}</p>
		</div>
		<div class="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
			<p class="mb-1 text-xs tracking-wider text-emerald-300 uppercase">Optimized</p>
			<p class="font-medium text-white">{formatBytes(result?.newSize ?? 0)}</p>
		</div>
	</div>

	<div class="mb-5 rounded-2xl bg-black/20 p-4">
		<img
			src={result?.url}
			alt="Processed result"
			class="h-auto max-h-72 w-full rounded-xl object-contain"
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
