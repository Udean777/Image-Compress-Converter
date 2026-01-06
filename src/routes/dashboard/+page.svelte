<script lang="ts">
	import type { PageProps } from './$types';
	import {
		UserInfoCard,
		ImageUploadForm,
		ProcessResult,
		HistoryList
	} from '$lib/components/dashboard';

	let { data, form }: PageProps = $props();

	let showSuccessResult = $derived(form?.success && form?.result);
</script>

<div class="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 p-6 md:p-10">
	<div class="mx-auto max-w-6xl">
		<!-- Header Section -->
		<header class="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
			<div>
				<h1
					class="bg-linear-to-r from-white via-purple-200 to-violet-300 bg-clip-text text-3xl font-bold text-transparent md:text-4xl"
				>
					Image Studio
				</h1>
				<p class="mt-1 text-slate-400">Compress & Convert your images instantly</p>
			</div>

			<UserInfoCard email={data.user.email} credits={data.user.credits} />
		</header>

		<!-- Main Content Grid -->
		<div class="grid gap-6 lg:grid-cols-2">
			<ImageUploadForm errorMessage={form?.message} />

			<div class="space-y-6">
				{#if showSuccessResult}
					<ProcessResult result={form!.result!} />
				{/if}

				<HistoryList history={data.history} />
			</div>
		</div>
	</div>
</div>
