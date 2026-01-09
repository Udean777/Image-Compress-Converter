<script lang="ts">
	import type { PageProps } from './$types';
	import { ImageUploadForm, ProcessResult, HistoryList } from '$lib/components/dashboard';
	import { IconError } from '$lib/components/icons';

	let { data, form }: PageProps = $props();

	let showSuccessResult = $derived(form?.success && form?.results?.length > 0);
</script>

<div class="space-y-8">
	<header>
		<h1 class="text-2xl font-bold text-foreground md:text-3xl lg:text-4xl">Image Studio</h1>
		<p class="mt-1 text-muted-foreground">Compress & Convert your images instantly</p>
	</header>

	<div class="relative grid w-full gap-4 sm:gap-6 xl:grid-cols-2">
		<ImageUploadForm />

		<div class="w-full min-w-0 space-y-6 overflow-x-hidden">
			{#if showSuccessResult && form?.results}
				<div class="space-y-4">
					<h3 class="font-semibold text-foreground">Just Processed</h3>
					{#each form.results as result}
						{#if 'url' in result}
							<ProcessResult {result} />
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
			{/if}
			<HistoryList history={data.history} />
		</div>
	</div>
</div>
