<script lang="ts">
	import Cropper from 'svelte-easy-crop';
	import { Button } from '$lib/components/ui/button';
	import { RotateCw, Check } from '@lucide/svelte';
	import { Slider } from '$lib/components/ui/slider';
	import { Label } from '$lib/components/ui/label';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Input } from '$lib/components/ui/input';

	interface Props {
		image: string;
		onCropComplete: (cropData: {
			x: number;
			y: number;
			width: number;
			height: number;
			filters?: any;
			watermark?: any;
		}) => void;
		onClose: () => void;
	}

	let { image, onCropComplete, onClose }: Props = $props();

	let crop = $state({ x: 0, y: 0 });
	let zoom = $state(1);
	let rotation = $state(0);
	let aspect = $state<number | undefined>(undefined);
	let pixelCrop = $state<any>(null);

	// Filters
	let brightness = $state(100);
	let contrast = $state(100);
	let saturation = $state(100);
	let grayscale = $state(0);

	// Watermark
	let showWatermarkOverlay = $state(false);
	let watermarkText = $state('Copyright');
	let watermarkX = $state(50); // %
	let watermarkY = $state(50); // %
	let isDragging = $state(false);

	function handleMouseDown(e: MouseEvent) {
		isDragging = true;
	}

	function handleMouseMove(e: MouseEvent) {
		if (isDragging) {
			const container = (e.currentTarget as HTMLElement).closest('.cropper-container');
			if (container) {
				const rect = container.getBoundingClientRect();
				watermarkX = ((e.clientX - rect.left) / rect.width) * 100;
				watermarkY = ((e.clientY - rect.top) / rect.height) * 100;
			}
		}
	}

	function handleMouseUp() {
		isDragging = false;
	}

	function handleCropComplete(e: any) {
		pixelCrop = e.detail.pixels;
	}

	function saveCrop() {
		if (pixelCrop) {
			onCropComplete({
				...pixelCrop,
				filters: { brightness, contrast, saturation, grayscale },
				watermark: showWatermarkOverlay
					? { text: watermarkText, x: watermarkX, y: watermarkY }
					: undefined
			});
		}
		onClose();
	}

	const aspects = [
		{ label: 'Free', value: undefined },
		{ label: '1:1', value: 1 / 1 },
		{ label: '4:3', value: 4 / 3 },
		{ label: '16:9', value: 16 / 9 },
		{ label: '2:3', value: 2 / 3 }
	];
</script>

<div class="flex h-full flex-col gap-6">
	<div
		class="cropper-container relative min-h-100 flex-1 overflow-hidden rounded-xl bg-muted"
		onmousemove={handleMouseMove}
		onmouseup={handleMouseUp}
		onmouseleave={handleMouseUp}
		role="none"
	>
		<!-- @ts-ignore -->
		<Cropper {image} bind:crop bind:zoom {aspect} oncropcomplete={handleCropComplete} />

		{#if showWatermarkOverlay}
			<div
				class="absolute z-10 cursor-move rounded border border-dashed border-white/50 bg-black/30 px-2 py-1 text-white shadow-lg backdrop-blur-xs select-none"
				style="left: {watermarkX}%; top: {watermarkY}%; transform: translate(-50%, -50%);"
				onmousedown={handleMouseDown}
				role="button"
				tabindex="0"
			>
				{watermarkText}
			</div>
		{/if}
	</div>

	<div class="grid grid-cols-1 gap-x-8 gap-y-4 px-1 md:grid-cols-2">
		<div class="space-y-3">
			<div class="flex justify-between">
				<Label class="text-xs">Brightness</Label>
				<span class="font-mono text-xs">{brightness}%</span>
			</div>
			<Slider
				type="single"
				value={brightness}
				min={0}
				max={200}
				step={1}
				onValueChange={(v) => (brightness = typeof v === 'number' ? v : v[0])}
			/>
		</div>

		<div class="space-y-3">
			<div class="flex justify-between">
				<Label class="text-xs">Contrast</Label>
				<span class="font-mono text-xs">{contrast}%</span>
			</div>
			<Slider
				type="single"
				value={contrast}
				min={0}
				max={200}
				step={1}
				onValueChange={(v) => (contrast = typeof v === 'number' ? v : v[0])}
			/>
		</div>

		<div class="space-y-3">
			<div class="flex justify-between">
				<Label class="text-xs">Saturation</Label>
				<span class="font-mono text-xs">{saturation}%</span>
			</div>
			<Slider
				type="single"
				value={saturation}
				min={0}
				max={200}
				step={1}
				onValueChange={(v) => (saturation = typeof v === 'number' ? v : v[0])}
			/>
		</div>

		<div class="space-y-3">
			<div class="flex justify-between">
				<Label class="text-xs">Grayscale</Label>
				<span class="font-mono text-xs">{grayscale}%</span>
			</div>
			<Slider
				type="single"
				value={grayscale}
				min={0}
				max={100}
				step={1}
				onValueChange={(v) => (grayscale = typeof v === 'number' ? v : v[0])}
			/>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-4 border-t pt-4 md:grid-cols-2">
		<div class="flex items-center space-x-3">
			<Checkbox id="show-watermark" bind:checked={showWatermarkOverlay} />
			<div class="grid gap-1.5 leading-none">
				<Label for="show-watermark" class="text-xs font-medium">Placement Watermark</Label>
				<p class="text-[10px] text-muted-foreground">Drag the watermark box on the image</p>
			</div>
		</div>
		{#if showWatermarkOverlay}
			<Input
				type="text"
				bind:value={watermarkText}
				placeholder="Watermark text..."
				class="h-9 text-xs"
			/>
		{/if}
	</div>

	<div class="flex flex-col gap-4">
		<div class="flex flex-wrap items-center justify-between gap-4">
			<div class="flex items-center gap-2 overflow-x-auto pb-1">
				{#each aspects as a}
					<Button
						variant={aspect === a.value ? 'default' : 'outline'}
						size="sm"
						onclick={() => (aspect = a.value)}
						class="h-8 text-xs"
					>
						{a.label}
					</Button>
				{/each}
			</div>

			<div class="flex items-center gap-2">
				<Button
					variant="outline"
					size="icon"
					onclick={() => (rotation = (rotation + 90) % 360)}
					title="Rotate"
				>
					<RotateCw class="size-4" />
				</Button>
			</div>
		</div>

		<div class="flex items-center gap-2 border-t pt-2">
			<Button variant="ghost" class="flex-1" onclick={onClose}>Cancel</Button>
			<Button class="flex-1 gap-2" onclick={saveCrop}>
				<Check class="size-4" /> Apply Changes
			</Button>
		</div>
	</div>
</div>
