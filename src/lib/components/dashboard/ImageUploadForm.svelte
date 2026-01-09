<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		IconImage,
		IconUpload,
		IconBolt,
		IconSettings,
		IconEye,
		IconClose
	} from '$lib/components/icons';
	import { IMAGE_ACTIONS, IMAGE_FORMATS } from '$lib/constants';
	import { ImageUpscale } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Slider } from '$lib/components/ui/slider';
	import * as Select from '$lib/components/ui/select';
	import { formatBytes } from '$lib/format';
	import UpgradePromptModal from './UpgradePromptModal.svelte';

	interface Props {
		user: any;
		onSubmitStart?: () => void;
		onSubmitEnd?: () => void;
		onSuccess?: (files: File[]) => void;
	}

	let { user, onSubmitStart, onSubmitEnd, onSuccess }: Props = $props();

	let loading = $state(false);
	let dragOver = $state(false);
	let showUpgradeModal = $state(false);

	interface FilePreview {
		file: File;
		preview: string;
	}

	let files = $state<FilePreview[]>([]);
	let quality = $state([80]);
	let showAdvanced = $state(false);

	let resizeWidth = $state<number>();
	let resizeHeight = $state<number>();

	let action = $state(IMAGE_ACTIONS[0].value);
	let targetFormat = $state(IMAGE_FORMATS[0].value);
	let watermarkPosition = $state('southeast');

	const WATERMARK_POSITIONS = [
		{ value: 'southeast', label: 'Bottom Right' },
		{ value: 'southwest', label: 'Bottom Left' },
		{ value: 'northeast', label: 'Top Right' },
		{ value: 'northwest', label: 'Top Left' },
		{ value: 'center', label: 'Center' }
	];

	function handleFiles(fileList: FileList) {
		const newFiles = Array.from(fileList).filter((file) => file.type.startsWith('image/'));

		newFiles.forEach((file) => {
			const reader = new FileReader();
			reader.onload = (e) => {
				files = [
					...files,
					{
						file,
						preview: e.target?.result as string
					}
				];

				// Auto-detect dimensions from the first file for resize default if needed
				if (files.length === 1) {
					const img = new Image();
					img.src = e.target?.result as string;
					img.onload = () => {
						resizeWidth = img.naturalWidth;
						resizeHeight = img.naturalHeight;
					};
				}
			};
			reader.readAsDataURL(file);
		});
	}

	function handleFileChange(event: Event): void {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files.length > 0) {
			handleFiles(input.files);
		}
	}

	function removeFile(index: number) {
		files = files.filter((_, i) => i !== index);
	}
</script>

<div class="flex flex-col gap-6 px-4 pt-6 pb-4 sm:px-6 sm:pt-6 sm:pb-6">
	<div class="flex items-center gap-3">
		<div
			class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-purple-500/30"
		>
			<IconImage class="h-6 w-6 text-primary-foreground" />
		</div>
		<div class="min-w-0 flex-1">
			<h3 class="truncate text-xl font-semibold text-foreground">Process Image</h3>
			<p class="text-sm wrap-break-word text-muted-foreground">Upload and transform your image</p>
		</div>
	</div>

	<div class="pb-6 sm:pb-6">
		<form
			method="POST"
			action="/dashboard?/process"
			enctype="multipart/form-data"
			class="space-y-6"
			use:enhance={({ cancel }) => {
				if (user.credits <= 0) {
					cancel();
					showUpgradeModal = true;
					return;
				}

				loading = true;
				onSubmitStart?.();
				return async ({ update, result }) => {
					await update();
					loading = false;

					if (result.type === 'success') {
						onSuccess?.(files.map((f) => f.file));
						toast.success('Image processed successfully');
					} else if (result.type === 'failure') {
						const msg = result.data?.message;
						toast.error(typeof msg === 'string' ? msg : 'Failed to process image');
					}

					files = [];
					onSubmitEnd?.();
				};
			}}
		>
			<div
				class="group relative w-full cursor-pointer rounded-2xl border-2 border-dashed p-4 text-center transition-all duration-300 sm:p-8
					{dragOver
					? 'border-primary bg-primary/10'
					: 'border-border hover:border-primary/50 hover:bg-muted/50'}"
				role="button"
				tabindex="0"
				ondragover={(e) => {
					e.preventDefault();
					dragOver = true;
				}}
				ondragleave={() => (dragOver = false)}
				ondrop={(e) => {
					e.preventDefault();
					dragOver = false;
					if (e.dataTransfer?.files) {
						handleFiles(e.dataTransfer.files);
					}
				}}
				onclick={() => document.getElementById('file-input')?.click()}
				onkeydown={(e) => e.key === 'Enter' && document.getElementById('file-input')?.click()}
			>
				<input
					id="file-input"
					type="file"
					name="image"
					accept="image/*"
					multiple
					disabled={loading}
					class="hidden"
					onchange={handleFileChange}
				/>

				{#if files.length === 0}
					<div class="space-y-3">
						<div
							class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-violet-500/20 to-purple-500/20 transition-transform duration-300 group-hover:scale-110"
						>
							<IconUpload class="h-8 w-8 text-violet-400" />
						</div>
						<p class="text-muted-foreground">
							Drag & drop or <span class="font-medium text-primary">browse</span>
						</p>
						<p class="text-sm text-muted-foreground">PNG, JPG, WEBP up to 5MB</p>
					</div>
				{:else}
					<div
						class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4"
						role="none"
						onclick={(e) => e.stopPropagation()}
						onkeydown={(e) => e.stopPropagation()}
					>
						{#each files as file, i}
							<div
								class="group/item relative aspect-square overflow-hidden rounded-xl border border-border bg-background"
							>
								<img
									src={file.preview}
									alt={file.file.name}
									class="h-full w-full object-cover transition-transform duration-300 group-hover/item:scale-105"
								/>
								<button
									type="button"
									onclick={(e) => {
										e.stopPropagation();
										removeFile(i);
									}}
									class="absolute top-2 right-2 rounded-full bg-black/50 p-1.5 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover/item:opacity-100 hover:bg-red-500"
								>
									<IconClose class="h-3 w-3" />
								</button>
								<div
									class="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/60 to-transparent p-2"
								>
									<p class="truncate text-xs font-medium text-white">{file.file.name}</p>
									<p class="text-[10px] text-white/80">{formatBytes(file.file.size)}</p>
								</div>
							</div>
						{/each}

						<button
							type="button"
							onclick={(e) => {
								e.stopPropagation();
								document.getElementById('file-input')?.click();
							}}
							class="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 transition-colors hover:border-primary/50 hover:bg-primary/5"
						>
							<IconUpload class="h-6 w-6 text-muted-foreground" />
							<span class="text-xs font-medium text-muted-foreground">Add More</span>
						</button>
					</div>
				{/if}
			</div>

			<div class="grid w-full min-w-0 gap-4 sm:grid-cols-2">
				<div class="space-y-2">
					<Label>Action</Label>
					<Select.Root type="single" bind:value={action} name="action">
						<Select.Trigger class="w-full truncate">
							{IMAGE_ACTIONS.find((a) => a.value === action)?.label || 'Select Action'}
						</Select.Trigger>
						<Select.Content>
							{#each IMAGE_ACTIONS as item}
								<Select.Item value={item.value}>{item.label}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					<input type="hidden" name="action" value={action} />
				</div>

				<div class="space-y-2">
					<Label>Target Format</Label>
					<Select.Root type="single" bind:value={targetFormat} name="format">
						<Select.Trigger class="w-full truncate">
							{IMAGE_FORMATS.find((f) => f.value === targetFormat)?.label || 'Select Format'}
						</Select.Trigger>
						<Select.Content>
							{#each IMAGE_FORMATS as item}
								<Select.Item value={item.value}>{item.label}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					<input type="hidden" name="format" value={targetFormat} />
				</div>
			</div>

			<div class="space-y-3 rounded-xl border border-border bg-muted/30 p-3 sm:p-4">
				<div class="flex justify-between">
					<Label>Quality</Label>
					<span class="text-sm font-bold text-primary">{quality[0]}%</span>
				</div>
				<Slider type="multiple" bind:value={quality} min={10} max={100} step={1} class="w-full" />
				<input type="hidden" name="quality" value={quality[0]} />
				<p class="text-xs text-muted-foreground">Lower quality = smaller file size</p>
			</div>

			<div class="overflow-hidden rounded-xl border border-border bg-card">
				<Button
					variant="ghost"
					type="button"
					class="flex h-auto w-full items-center justify-between rounded-none p-3 hover:bg-muted/50 sm:p-4"
					onclick={() => (showAdvanced = !showAdvanced)}
				>
					<div class="flex items-center gap-2">
						<IconSettings class="h-4 w-4 text-primary" />
						<span>Advanced Editor</span>
					</div>
					<span class="text-xs text-muted-foreground">{showAdvanced ? 'Hide' : 'Show'} Options</span
					>
				</Button>

				{#if showAdvanced}
					<div
						class="animate-in space-y-6 border-t border-border p-3 pt-0 slide-in-from-top-2 sm:p-4"
					>
						<div class="space-y-3 pt-4">
							<h4
								class="flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase"
							>
								<ImageUpscale class="h-3 w-3" /> Resize
							</h4>
							<div class="grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
								<div class="space-y-2">
									<Label class="text-xs" for="width">Max Width (px)</Label>
									<Input
										type="number"
										name="width"
										id="width"
										placeholder="Auto"
										bind:value={resizeWidth}
									/>
								</div>
								<div class="space-y-2">
									<Label class="text-xs" for="height">Max Height (px)</Label>
									<Input
										type="number"
										name="height"
										id="height"
										placeholder="Auto"
										bind:value={resizeHeight}
									/>
								</div>
							</div>
						</div>

						<div class="space-y-3">
							<h4
								class="flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase"
							>
								<IconEye class="h-3 w-3" /> Watermark
								{#if user.tier === 'free'}
									<span
										class="ml-auto rounded bg-primary/10 px-1.5 py-0.5 text-[10px] tracking-normal text-primary normal-case"
										>PRO Only</span
									>
								{/if}
							</h4>
							<div class="space-y-2 {user.tier === 'free' ? 'pointer-events-none opacity-50' : ''}">
								<Label class="text-xs" for="watermark">Upload Logo</Label>
								<Input
									type="file"
									name="watermark"
									id="watermark"
									accept="image/png"
									disabled={user.tier === 'free'}
									class="cursor-pointer file:text-primary"
								/>
							</div>
							<div class="space-y-2">
								<Label class="text-xs">Position</Label>
								<Select.Root type="single" bind:value={watermarkPosition} name="watermarkPosition">
									<Select.Trigger class="w-full">
										{WATERMARK_POSITIONS.find((p) => p.value === watermarkPosition)?.label ||
											'Select Position'}
									</Select.Trigger>
									<Select.Content>
										{#each WATERMARK_POSITIONS as pos}
											<Select.Item value={pos.value}>{pos.label}</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
								<input type="hidden" name="watermarkPosition" value={watermarkPosition} />
							</div>
						</div>
					</div>
				{/if}
			</div>

			<Button
				type="submit"
				disabled={loading}
				class="w-full py-4 text-base font-semibold shadow-lg shadow-purple-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-purple-500/50 sm:py-6"
			>
				{#if loading}
					<svg class="mr-2 h-5 w-5 animate-spin" viewBox="0 0 24 24">
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
					<IconBolt class="mr-2 h-5 w-5" />
					Process {files.length > 0 ? `${files.length} Images` : 'Image'}
				{/if}
			</Button>
		</form>

		<UpgradePromptModal bind:open={showUpgradeModal} />
	</div>
</div>
