<script lang="ts">
	import type { PageProps } from './$types';
	import { ImageUploadForm, ProcessResult, HistoryList } from '$lib/components/dashboard';

	let { data, form }: PageProps = $props();

	let showSuccessResult = $derived(form?.success && form?.result);
</script>

<div class="space-y-8">
	<header>
		<h1 class="text-3xl font-bold text-foreground md:text-4xl">Image Studio</h1>
		<p class="mt-1 text-muted-foreground">Compress & Convert your images instantly</p>
	</header>

	<div class="grid gap-6 lg:grid-cols-2">
		<ImageUploadForm />
		<div class="space-y-6">
			{#if showSuccessResult && form?.result}
				<ProcessResult result={form.result} />
			{/if}
			<HistoryList history={data.history} />
		</div>
	</div>
</div>
