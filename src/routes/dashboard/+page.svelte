<script lang="ts">
	import type { PageProps } from './$types';
	import { ImageUploadForm, ProcessResult, HistoryList } from '$lib/components/dashboard';

	let { data, form }: PageProps = $props();

	let showSuccessResult = $derived(form?.success && form?.result);
	let errorMessage = $derived(form?.message && !form?.success ? form.message : undefined);
</script>

<div class="space-y-8">
	<header>
		<h1
			class="bg-linear-to-r from-white via-purple-200 to-violet-300 bg-clip-text text-3xl font-bold text-transparent md:text-4xl"
		>
			Image Studio
		</h1>
		<p class="mt-1 text-slate-400">Compress & Convert your images instantly</p>
	</header>

	<div class="grid gap-6 lg:grid-cols-2">
		<ImageUploadForm {errorMessage} />
		<div class="space-y-6">
			{#if showSuccessResult && form?.result}
				<ProcessResult result={form.result} />
			{/if}
			<HistoryList history={data.history} />
		</div>
	</div>
</div>
