<script lang="ts">
	import { IconImage, IconUpload, IconBolt, IconError } from '$lib/components/icons';
	import { IMAGE_ACTIONS, IMAGE_FORMATS } from '$lib/constants';

	interface Props {
		errorMessage?: string;
	}

	let { errorMessage }: Props = $props();

	let dragOver = $state(false);
	let fileName = $state('');

	function handleFileChange(event: Event): void {
		const input = event.target as HTMLInputElement;
		if (input.files?.[0]) {
			fileName = input.files[0].name;
		}
	}

	function handleDragOver(event: DragEvent): void {
		event.preventDefault();
		dragOver = true;
	}

	function handleDragLeave(): void {
		dragOver = false;
	}

	function handleDrop(): void {
		dragOver = false;
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

	<form method="POST" action="?/process" enctype="multipart/form-data" class="space-y-5">
		<!-- File Upload Zone -->
		<div
			role="region"
			aria-label="File Upload Drop Zone"
			class="group relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300
				{dragOver
				? 'border-violet-400 bg-violet-500/10'
				: 'border-white/20 hover:border-violet-400/50 hover:bg-white/5'}"
			ondragover={handleDragOver}
			ondragleave={handleDragLeave}
			ondrop={handleDrop}
		>
			<input
				type="file"
				name="image"
				accept="image/*"
				required
				class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
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
					<p class="text-sm text-slate-500">PNG, JPG, WEBP up to 10MB</p>
				{/if}
			</div>
		</div>

		<!-- Options Grid -->
		<div class="grid gap-4 sm:grid-cols-2">
			<div class="space-y-2">
				<label for="action" class="block text-sm font-medium text-slate-300">Action</label>
				<select
					name="action"
					id="action"
					class="w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white transition-all focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/50 focus:outline-none"
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
					class="w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white transition-all focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/50 focus:outline-none"
				>
					{#each IMAGE_FORMATS as format}
						<option value={format.value} class="bg-slate-800">{format.label}</option>
					{/each}
				</select>
			</div>
		</div>

		<!-- Submit Button -->
		<button
			type="submit"
			class="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-violet-600 to-purple-600 px-6 py-4 font-semibold text-white shadow-lg shadow-purple-500/30 transition-all duration-300 hover:scale-[1.02] hover:from-violet-500 hover:to-purple-500 hover:shadow-purple-500/50 active:scale-[0.98]"
		>
			<IconBolt size={20} />
			Process Image
			<span class="ml-1 rounded-lg bg-white/20 px-2 py-0.5 text-sm">1 Credit</span>
		</button>
	</form>

	<!-- Error Message -->
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
