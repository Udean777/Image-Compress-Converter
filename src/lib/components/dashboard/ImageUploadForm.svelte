<script lang="ts">
	import { enhance } from '$app/forms';
	import { IconImage, IconUpload, IconBolt, IconError } from '$lib/components/icons';
	import { IMAGE_ACTIONS, IMAGE_FORMATS } from '$lib/constants';

	interface Props {
		errorMessage?: string;
		onSubmitStart?: () => void;
		onSubmitEnd?: () => void;
	}

	let { errorMessage, onSubmitStart, onSubmitEnd }: Props = $props();

	let loading = $state(false);
	let dragOver = $state(false);
	let fileName = $state('');

	function handleFileChange(event: Event): void {
		const input = event.target as HTMLInputElement;
		if (input.files?.[0]) {
			fileName = input.files[0].name;
		}
	}
</script>

<section
	class="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl md:p-8"
	aria-labelledby="upload-title"
>
	<div class="mb-6 flex items-center gap-3">
		<div
			class="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-violet-500 to-purple-600 shadow-lg shadow-purple-500/30"
		>
			<IconImage class="h-6 w-6 text-white" />
		</div>
		<div>
			<h2 id="upload-title" class="text-xl font-semibold text-white">Process Image</h2>
			<p class="text-sm text-slate-400">Upload and transform your image</p>
		</div>
	</div>

	<form
		method="POST"
		action="?/process"
		enctype="multipart/form-data"
		class="space-y-5"
		use:enhance={() => {
			loading = true;
			onSubmitStart?.();
			return async ({ update }) => {
				await update();
				loading = false;
				fileName = '';
				onSubmitEnd?.();
			};
		}}
	>
		<div
			class="group relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300
				{dragOver
				? 'border-violet-400 bg-violet-500/10'
				: 'border-white/20 hover:border-violet-400/50 hover:bg-white/5'}"
			role="button"
			tabindex="0"
			ondragover={(e) => {
				e.preventDefault();
				dragOver = true;
			}}
			ondragleave={() => (dragOver = false)}
			ondrop={() => (dragOver = false)}
		>
			<input
				type="file"
				name="image"
				accept="image/*"
				required
				disabled={loading}
				class="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
				onchange={handleFileChange}
			/>
			<div class="space-y-3">
				<div
					class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-violet-500/20 to-purple-500/20 transition-transform duration-300 group-hover:scale-110"
				>
					<IconUpload class="h-8 w-8 text-violet-400" />
				</div>
				{#if fileName}
					<p class="font-medium text-violet-300">{fileName}</p>
				{:else}
					<p class="text-slate-300">
						Drag & drop or <span class="font-medium text-violet-400">browse</span>
					</p>
					<p class="text-sm text-slate-500">PNG, JPG, WEBP up to 5MB</p>
				{/if}
			</div>
		</div>

		<div class="grid gap-4 sm:grid-cols-2">
			<div class="space-y-2">
				<label for="action" class="block text-sm font-medium text-slate-300">Action</label>
				<select
					name="action"
					id="action"
					disabled={loading}
					class="w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white transition-all focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/50 focus:outline-none disabled:opacity-50"
				>
					{#each IMAGE_ACTIONS as action}
						<option value={action.value} class="bg-slate-800">{action.label}</option>
					{/each}
				</select>
			</div>

			<div class="space-y-2">
				<label for="format" class="block text-sm font-medium text-slate-300">Target Format</label>
				<select
					name="format"
					id="format"
					disabled={loading}
					class="w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white transition-all focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/50 focus:outline-none disabled:opacity-50"
				>
					{#each IMAGE_FORMATS as format}
						<option value={format.value} class="bg-slate-800">{format.label}</option>
					{/each}
				</select>
			</div>
		</div>

		<button
			type="submit"
			disabled={loading}
			class="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-violet-600 to-purple-600 px-6 py-4 font-semibold text-white shadow-lg shadow-purple-500/30 transition-all duration-300 hover:scale-[1.02] hover:from-violet-500 hover:to-purple-500 hover:shadow-purple-500/50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
		>
			{#if loading}
				<svg class="h-5 w-5 animate-spin" viewBox="0 0 24 24">
					<circle
						class="opacity-25"
						cx="12"
						cy="12"
						r="10"
						stroke="currentColor"
						stroke-width="4"
						fill="none"
					/>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					/>
				</svg>
				Processing...
			{:else}
				<IconBolt class="h-5 w-5" />
				Process Image
				<span class="ml-1 rounded-lg bg-white/20 px-2 py-0.5 text-sm">1 Credit</span>
			{/if}
		</button>
	</form>

	{#if errorMessage}
		<div
			class="mt-4 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4"
			role="alert"
		>
			<IconError class="h-5 w-5 text-red-400" />
			<p class="text-sm text-red-300">{errorMessage}</p>
		</div>
	{/if}
</section>
