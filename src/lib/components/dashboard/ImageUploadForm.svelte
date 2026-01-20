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
	import { IMAGE_ACTIONS, IMAGE_FORMATS, isFeatureAllowed, TIER_LIMITS } from '$lib/constants';
	import { ImageUpscale, Lock } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Slider } from '$lib/components/ui/slider';
	import * as Select from '$lib/components/ui/select';
	import * as Dialog from '$lib/components/ui/dialog';
	import { formatBytes } from '$lib/format';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import UpgradePromptModal from './UpgradePromptModal.svelte';
	import ImageCropper from './ImageCropper.svelte';

	interface Props {
		user: any;
		onSubmitStart?: () => void;
		onSubmitEnd?: () => void;
		onSuccess?: (files: File[]) => void;
		connectors?: any[];
	}

	let { user, onSubmitStart, onSubmitEnd, onSuccess, connectors = [] }: Props = $props();

	let loading = $state(false);
	let dragOver = $state(false);
	let showUpgradeModal = $state(false);
	let upgradeModalTitle = $state('Upgrade Plan');
	let upgradeModalDescription = $state('Fitur ini memerlukan plan yang lebih tinggi.');

	interface FilePreview {
		file: File;
		preview: string;
		crop?: { x: number; y: number; width: number; height: number };
	}

	let files = $state<FilePreview[]>([]);
	let quality = $state([80]);
	let showAdvanced = $state(false);

	let editingFileIndex = $state<number | null>(null);
	let showCropper = $state(false);

	let resizeWidth = $state<number>();
	let resizeHeight = $state<number>();
	let watermarkText = $state('');
	let stripMetadata = $state(true);

	let action = $state(IMAGE_ACTIONS[0].value);
	let targetFormat = $state(IMAGE_FORMATS[0].value);
	let watermarkPosition = $state('southeast');

	// AI Features
	let generateAltText = $state(false);
	let upscale = $state(false);
	let smartCompression = $state(true);

	let selectedDestination = $state('default');

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
			use:enhance={({ cancel, formData }) => {
				const userTier = user.planTier || 'free';
				const limits = TIER_LIMITS[userTier as keyof typeof TIER_LIMITS];

				if (user.credits <= 0) {
					cancel();
					upgradeModalTitle = 'Credit Habis!';
					upgradeModalDescription =
						'Anda telah menggunakan semua credit gratis Anda. Upgrade ke paket Pro untuk terus menggunakan fitur premium tanpa batas.';
					showUpgradeModal = true;
					return;
				}

				// Check action permission
				const selectedAction = IMAGE_ACTIONS.find((a) => a.value === action);
				if (selectedAction && !isFeatureAllowed(userTier, selectedAction.minTier)) {
					cancel();
					toast.error('Tier kamu belum cukup tinggi, upgrade plan sekarang!');
					upgradeModalTitle = 'Upgrade Plan Diperlukan';
					upgradeModalDescription = `Fitur "${selectedAction.label}" memerlukan plan yang lebih tinggi. Upgrade sekarang untuk membuka akses!`;
					showUpgradeModal = true;
					return;
				}

				// Check file size
				for (const f of files) {
					if (f.file.size > limits.maxFileSize) {
						cancel();
						toast.error(
							`File ${f.file.name} exceeds ${userTier} limit of ${limits.maxFileSize / 1024 / 1024}MB`
						);
						return;
					}
				}

				formData.delete('images');
				files.forEach((f) => {
					formData.append('images', f.file);
				});

				loading = true;
				onSubmitStart?.();
				return async ({ update, result }) => {
					await update();
					loading = false;

					if (result.type === 'success') {
						onSuccess?.(files.map((f) => f.file));
						toast.success('Image processed successfully');
						files = [];
					} else if (result.type === 'failure') {
						const msg = result.data?.message;
						toast.error(typeof msg === 'string' ? msg : 'Failed to process image');
					}

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
					name="images"
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
						<p class="text-sm text-muted-foreground">PNG, JPG, WEBP up to {TIER_LIMITS[(user.planTier as keyof typeof TIER_LIMITS) || 'free'].maxFileSize / 1024 / 1024}MB</p>
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
									<div class="flex items-center justify-between gap-2">
										<p class="text-[10px] text-white/80">{formatBytes(file.file.size)}</p>
										<button
											type="button"
											onclick={(e) => {
												e.stopPropagation();
												editingFileIndex = i;
												showCropper = true;
											}}
											class="text-[10px] text-white underline transition-colors hover:text-primary"
										>
											{file.crop ? 'Edit Crop' : 'Crop'}
										</button>
									</div>
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
								<Select.Item
									value={item.value}
									class="flex items-center justify-between"
									disabled={!isFeatureAllowed(user.planTier || 'free', item.minTier)}
								>
									<span>{item.label}</span>
									{#if !isFeatureAllowed(user.planTier || 'free', item.minTier)}
										<Lock class="ml-2 size-3 text-muted-foreground" />
									{/if}
								</Select.Item>
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
				<Slider
					type="multiple"
					bind:value={quality}
					min={10}
					max={TIER_LIMITS[(user.planTier as keyof typeof TIER_LIMITS) || 'free']?.maxQuality ||
						100}
					step={1}
					class="w-full"
				/>
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
								{#if !isFeatureAllowed(user.planTier || 'free', 'pro')}
									<span
										class="ml-auto flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] tracking-normal text-primary normal-case"
										><Lock class="size-2" /> PRO Only</span
									>
								{/if}
							</h4>
							<div
								class="space-y-2 {!isFeatureAllowed(user.planTier || 'free', 'pro')
									? 'pointer-events-none opacity-50'
									: ''}"
							>
								<Label class="text-xs" for="watermark">Watermark Type</Label>
								<div class="grid grid-cols-2 gap-2">
									<Input
										type="text"
										name="watermarkText"
										placeholder="Text (e.g. © Studio)"
										bind:value={watermarkText}
										class="text-xs"
									/>
									<Input
										type="file"
										name="watermark"
										id="watermark"
										accept="image/png"
										disabled={!isFeatureAllowed(user.planTier || 'free', 'pro')}
										class="cursor-pointer text-xs file:text-primary"
									/>
								</div>
								<p class="text-[10px] text-muted-foreground">Upload PNG for logo or enter text</p>
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

							<div class="flex items-center space-x-2 pt-2">
								<Checkbox id="strip-metadata" name="stripMetadata" bind:checked={stripMetadata} />
								<div class="grid gap-1.5 leading-none">
									<Label
										for="strip-metadata"
										class="text-xs leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
									>
										Strip Metadata
									</Label>
									<p class="text-[10px] text-muted-foreground">
										Remove EXIF and GPS data for privacy
									</p>
								</div>
								<input type="hidden" name="stripMetadata" value={stripMetadata ? 'on' : 'off'} />
							</div>
						</div>

						<div class="space-y-4 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
							<h4
								class="flex items-center gap-2 text-xs font-semibold tracking-wider text-blue-500 uppercase"
							>
								<IconUpload class="h-3 w-3" /> Cloud Destinations
							</h4>

							<div class="space-y-3">
								<div class="space-y-2">
									<Label class="text-xs">Storage Target</Label>
									<Select.Root type="single" bind:value={selectedDestination}>
										<Select.Trigger class="w-full text-xs">
											{selectedDestination === 'default'
												? 'Default Studio Storage'
												: connectors
														.find((c) => c.provider === selectedDestination)
														?.provider.toUpperCase() || 'Select Storage'}
										</Select.Trigger>
										<Select.Content>
											<Select.Item value="default">Default Studio Storage</Select.Item>
											{#each connectors as conn}
												<Select.Item value={conn.provider}>
													{conn.provider.toUpperCase()} ({conn.provider === 's3'
														? conn.config.bucket
														: 'Active'})
												</Select.Item>
											{/each}
											{#if connectors.length === 0}
												<div class="p-2 text-center">
													<p class="mb-1 text-[10px] text-muted-foreground">
														No custom storage configured
													</p>
													<Button
														variant="outline"
														size="sm"
														class="h-6 text-[10px]"
														href="/dashboard/connectors"
													>
														Add Connector
													</Button>
												</div>
											{/if}
										</Select.Content>
									</Select.Root>
								</div>
								<p class="text-[10px] text-muted-foreground">
									Save processed files directly to your cloud storage.
								</p>
							</div>
						</div>

						<div class="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
							<h4
								class="flex items-center gap-2 text-xs font-semibold tracking-wider text-primary uppercase"
							>
								<IconBolt class="h-3 w-3" /> AI Enhancements
							</h4>

							<div class="space-y-3">
								<div class="flex items-center justify-between">
									<div class="space-y-0.5">
										<Label class="text-xs">Smart Compression</Label>
										<p class="text-[10px] text-muted-foreground">AI-optimized quality vs size</p>
									</div>
									<Checkbox bind:checked={smartCompression} />
								</div>

								<div class="flex items-center justify-between">
									<div class="space-y-0.5">
										<Label class="text-xs">AI Alt-Text</Label>
										<p class="text-[10px] text-muted-foreground">
											Generate accessible descriptions
										</p>
									</div>
									<Checkbox bind:checked={generateAltText} />
								</div>

								<div class="flex items-center justify-between">
									<div class="space-y-0.5">
										<Label class="flex items-center gap-1 text-xs">
											Super Resolution <span class="rounded bg-primary/20 px-1 py-0.5 text-[8px]"
												>2X</span
											>
										</Label>
										<p class="text-[10px] text-muted-foreground">High-quality AI upscaling</p>
									</div>
									<Checkbox bind:checked={upscale} />
								</div>
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

			<input type="hidden" name="generateAltText" value={generateAltText} />
			<input type="hidden" name="upscale" value={upscale} />
			<input type="hidden" name="smartCompression" value={smartCompression} />
			<input type="hidden" name="destination" value={selectedDestination} />
		</form>

		<UpgradePromptModal
			bind:open={showUpgradeModal}
			title={upgradeModalTitle}
			description={upgradeModalDescription}
		/>

		{#if showCropper && editingFileIndex !== null}
			<Dialog.Root bind:open={showCropper}>
				<Dialog.Content class="flex h-[90vh] flex-col p-6 sm:max-w-175">
					<Dialog.Header>
						<Dialog.Title>Edit Image: {files[editingFileIndex].file.name}</Dialog.Title>
						<Dialog.Description>
							Adjust the cropping area, aspect ratio, and rotation.
						</Dialog.Description>
					</Dialog.Header>

					<div class="min-h-0 flex-1 pt-4">
						<ImageCropper
							image={files[editingFileIndex].preview}
							onCropComplete={(cropData: any) => {
								if (editingFileIndex !== null) {
									files[editingFileIndex].crop = cropData;
								}
							}}
							onClose={() => {
								showCropper = false;
								editingFileIndex = null;
							}}
						/>
					</div>
				</Dialog.Content>
			</Dialog.Root>
		{/if}

		{#each files as file, i}
			{#if file.crop}
				<input type="hidden" name="crop_{i}" value={JSON.stringify(file.crop)} />
			{/if}
		{/each}
	</div>
</div>
