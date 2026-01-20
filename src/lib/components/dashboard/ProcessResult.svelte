<script lang="ts">
	import { IconCheck, IconDownload, IconCloud } from '$lib/components/icons';
	import Compare from '$lib/components/Compare.svelte';
	import { formatBytes } from '$lib/format';
	import type { ProcessSuccess } from '$lib/types/image.types';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';

	interface Props {
		result: ProcessSuccess;
		originalUrl?: string;
	}

	let { result, originalUrl }: Props = $props();
</script>

<div
	class="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-md"
>
	<!-- Header Stats -->
	<div class="flex items-center justify-between border-b border-border/50 bg-muted/30 px-4 py-3">
		<div class="flex items-center gap-2">
			<Badge variant="outline" class="border-emerald-500/20 bg-emerald-500/10 text-emerald-600">
				{formatBytes(result?.newSize ?? 0)}
			</Badge>
			<span class="text-xs text-muted-foreground line-through">
				{formatBytes(result?.originalSize ?? 0)}
			</span>
		</div>
		<Badge class="bg-emerald-500 text-[10px] font-bold text-white hover:bg-emerald-600">
			{result?.stats}
		</Badge>
	</div>

	<!-- Image Comparison Area -->
	<div class="relative bg-muted/50 p-4">
		<Compare
			firstImage={originalUrl}
			secondImage={result.url}
			firstImageClass="object-contain object-center"
			secondImageClass="object-contain object-center"
			class="h-48 w-full transition-all duration-300 group-hover:h-52 sm:h-56"
			slideMode="hover"
		/>
	</div>

	<!-- Actions -->
	<div class="flex items-center justify-between gap-3 p-3">
		<div class="flex min-w-0 flex-1 flex-col">
			<span class="truncate text-xs font-medium text-foreground">
				{result.format.toUpperCase()}
			</span>
			<span class="truncate text-[10px] text-muted-foreground"> Processed success </span>
		</div>
		<div class="flex items-center gap-2">
			{#if result.externalUrl}
				<Button
					href={result.externalUrl}
					target="_blank"
					variant="outline"
					size="sm"
					class="text-[10px] h-8 px-2"
				>
					<IconCloud class="mr-1 h-3 w-3" />
					Drive
				</Button>
			{/if}
			<Button
				href={result?.downloadUrl}
				download
				size="sm"
				class="bg-emerald-600 text-xs font-semibold hover:bg-emerald-500"
			>
				<IconDownload class="mr-1.5 h-3.5 w-3.5" />
				Download
			</Button>
		</div>
	</div>
</div>
