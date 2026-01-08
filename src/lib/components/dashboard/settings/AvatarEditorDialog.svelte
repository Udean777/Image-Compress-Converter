<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Slider } from '$lib/components/ui/slider';
	import getCroppedImg from '$lib/utils/image';
	import { toast } from 'svelte-sonner';

	let {
		open = $bindable(false),
		imageSrc
	}: {
		open: boolean;
		imageSrc: string | null;
	} = $props();

	let loading = $state(false);
	let zoom = $state(1);
	let sliderValue = $state(1);
	let croppedAreaPixels = $state<{ x: number; y: number; width: number; height: number } | null>(
		null
	);

	/* Custom Cropper State */
	let imgElement = $state<HTMLImageElement>();
	let containerElement = $state<HTMLDivElement>();
	let isDragging = $state(false);
	let startPos = $state({ x: 0, y: 0 });
	let imagePos = $state({ x: 0, y: 0 });

	function handleMouseDown(e: MouseEvent | TouchEvent) {
		e.preventDefault();
		isDragging = true;
		const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
		const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
		startPos = { x: clientX - imagePos.x, y: clientY - imagePos.y };
	}

	function handleMouseMove(e: MouseEvent | TouchEvent) {
		if (!isDragging) return;
		e.preventDefault();
		const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
		const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
		imagePos = { x: clientX - startPos.x, y: clientY - startPos.y };
		calculateCrop();
	}

	function handleMouseUp() {
		isDragging = false;
		calculateCrop();
	}

	function calculateCrop() {
		if (!imgElement || !containerElement) return;

		const containerRect = containerElement.getBoundingClientRect();
		const imageRect = imgElement.getBoundingClientRect();

		// Calculate the scale between the rendered image size and the natural size
		const scaleX = imgElement.naturalWidth / imageRect.width;
		const scaleY = imgElement.naturalHeight / imageRect.height;

		// Calculate the top/left visible offset relative to the image
		// visual offset = container.left - image.left
		const visualX = containerRect.left - imageRect.left;
		const visualY = containerRect.top - imageRect.top;

		// Map to natural image coordinates
		const x = Math.max(0, visualX * scaleX);
		const y = Math.max(0, visualY * scaleY);
		const width = containerRect.width * scaleX;
		const height = containerRect.height * scaleY;

		croppedAreaPixels = { x, y, width, height };
	}

	// Recalculate when zoom changes
	$effect(() => {
		if (zoom || imagePos) {
			// Small timeout to allow DOM to update transform
			setTimeout(calculateCrop, 0);
		}
	});

	// Reset when image changes
	$effect(() => {
		if (imageSrc) {
			imagePos = { x: 0, y: 0 };
			zoom = 1;
			sliderValue = 1;
			setTimeout(calculateCrop, 100);
		}
	});

	async function onSaveCrop() {
		// Force calculation one last time
		calculateCrop();

		if (!imageSrc) {
			console.error('No avatar image present');
			return;
		}

		if (!croppedAreaPixels) {
			console.error('croppedAreaPixels is null. Crop event may not have fired.');
			alert('Please verify the crop area before saving.');
			return;
		}

		try {
			loading = true;
			const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);

			if (!croppedImageBlob) {
				throw new Error('Failed to crop image');
			}

			// Create a File object from the Blob
			const file = new File([croppedImageBlob], 'avatar.jpg', { type: 'image/jpeg' });

			// Submit via FormData manually since we're outside a form for the crop
			const formData = new FormData();
			formData.append('avatar', file);

			const response = await fetch('?/updateAvatar', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (result.type === 'success') {
				toast.success('Avatar updated successfully');
				// Refresh page data to show new avatar immediately
				window.location.reload();
			} else {
				// Handle error
				console.error('Upload failed', result);
				toast.error(result?.data?.message || 'Upload failed');
			}
		} catch (e) {
			console.error('Exception in onSaveCrop:', e);
			alert('Error saving crop: ' + (e instanceof Error ? e.message : String(e)));
		} finally {
			loading = false;
			open = false;
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="border-border bg-background sm:max-w-125">
		<Dialog.Header>
			<Dialog.Title class="text-xl font-semibold text-foreground">Edit Avatar</Dialog.Title>
			<Dialog.Description class="text-muted-foreground">
				Drag to position and zoom to scale.
			</Dialog.Description>
		</Dialog.Header>

		<div
			class="relative mt-4 flex h-64 w-full items-center justify-center overflow-hidden rounded-xl bg-muted/50 select-none"
		>
			{#if imageSrc}
				<!-- Container that acts as the "Crop Frame" -->
				<div
					bind:this={containerElement}
					class="relative z-10 h-48 w-48 overflow-hidden rounded-full shadow-xl ring-4 ring-border/50"
				>
					<!-- Draggable Image -->
					<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
					<img
						bind:this={imgElement}
						src={imageSrc}
						alt="Crop preview"
						class="max-w-none origin-center cursor-move touch-none"
						style="transform: translate({imagePos.x}px, {imagePos.y}px) scale({zoom});"
						onmousedown={handleMouseDown}
						ontouchstart={handleMouseDown}
						onmousemove={handleMouseMove}
						ontouchmove={handleMouseMove}
						onmouseup={handleMouseUp}
						ontouchend={handleMouseUp}
						onmouseleave={handleMouseUp}
						draggable="false"
					/>
				</div>

				<!-- Visual Overlay for context -->
				<div class="pointer-events-none absolute inset-0 z-0 bg-background/50"></div>
			{/if}
		</div>

		<div class="space-y-3 py-4">
			<div class="flex items-center justify-between text-xs text-muted-foreground">
				<span>Zoom</span>
				<span>{Math.round(zoom * 100)}%</span>
			</div>
			<Slider
				bind:value={sliderValue}
				type="single"
				min={1}
				max={3}
				step={0.1}
				class="w-full"
				onValueChange={(val) => {
					zoom = val;
				}}
			/>
		</div>

		<Dialog.Footer>
			<button
				onclick={() => (open = false)}
				class="px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
			>
				Cancel
			</button>
			<button
				onclick={onSaveCrop}
				disabled={loading}
				class="rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 disabled:opacity-50"
			>
				{#if loading}
					Saving...
				{:else}
					Save Changes
				{/if}
			</button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
