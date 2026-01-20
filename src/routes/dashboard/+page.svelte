<script lang="ts">
	import type { PageProps } from './$types';
	import { ImageUploadForm, ProcessResult, HistoryList } from '$lib/components/dashboard';
	import { IconError, IconDownload } from '$lib/components/icons';
	import { Button } from '$lib/components/ui/button';
	import { onDestroy } from 'svelte';

	let { data, form }: PageProps = $props();

	let showSuccessResult = $derived(form?.success && form?.results?.length > 0);
	let originalObjectUrls = $state<string[]>([]);

	function handleSuccess(files: File[]) {
		originalObjectUrls.forEach((url) => URL.revokeObjectURL(url));
		originalObjectUrls = files.map((file) => URL.createObjectURL(file));
	}

	onDestroy(() => {
		originalObjectUrls.forEach((url) => URL.revokeObjectURL(url));
	});
</script>

<div class="space-y-8">
	<header>
		<h1 class="text-2xl font-bold text-foreground md:text-3xl lg:text-4xl">Image Studio</h1>
		<p class="mt-1 text-muted-foreground">Compress & Convert your images instantly</p>
	</header>

	<div class="relative grid w-full gap-4 sm:gap-6 xl:grid-cols-2">
		<ImageUploadForm onSuccess={handleSuccess} user={data.user} connectors={data.connectors} />

		<div class="w-full min-w-0 space-y-6 overflow-x-hidden">
			{#if showSuccessResult && form?.results}
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<h3 class="font-semibold text-foreground">
							Processed {form.results.length}
							{form.results.length > 1 ? 'Images' : 'Image'}
						</h3>
						{#if form.results.length > 1}
							<Button
								onclick={async () => {
									const urls = form?.results.filter((r: any) => 'url' in r).map((r: any) => r.url);
									if (!urls.length) return;

									try {
										const res = await fetch('/api/download-batch', {
											method: 'POST',
											body: JSON.stringify({ urls })
										});
										if (res.ok) {
											const blob = await res.blob();
											const url = window.URL.createObjectURL(blob);
											const a = document.createElement('a');
											a.href = url;
											a.download = `batch-${Date.now()}.zip`;
											document.body.appendChild(a);
											a.click();
											window.URL.revokeObjectURL(url);
										}
									} catch (e) {
										console.error(e);
									}
								}}
								variant="default"
								size="sm"
								class="bg-foreground font-semibold text-background shadow-sm hover:bg-foreground/90"
							>
								<IconDownload class="mr-2 h-4 w-4" />
								Download All (.ZIP)
							</Button>
						{/if}
					</div>

					<div class="grid gap-4 {form.results.length > 1 ? 'md:grid-cols-2' : ''}">
						{#each form.results as any[] as result, i}
							{#if 'url' in result}
								<ProcessResult {result} originalUrl={originalObjectUrls[i]} />
							{:else if 'data' in result && result.data?.message}
								<div
									class="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-900/20"
								>
									<div class="flex items-center gap-3">
										<div
											class="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/40"
										>
											<IconError class="h-5 w-5 text-red-600 dark:text-red-400" />
										</div>
										<div>
											<p class="font-medium text-red-900 dark:text-red-200">Processing Failed</p>
											<p class="text-sm text-red-700 dark:text-red-300">{result.data.message}</p>
										</div>
									</div>
								</div>
							{/if}
						{/each}
					</div>
				</div>
			{/if}
			<HistoryList history={data.history} />
		</div>
	</div>
</div>
