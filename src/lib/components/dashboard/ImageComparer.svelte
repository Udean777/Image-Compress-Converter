<script lang="ts">
	import { IconBolt } from '$lib/components/icons';

	interface Props {
		beforeImage: string;
		afterImage: string;
		beforeLabel?: string;
		afterLabel?: string;
	}

	let {
		beforeImage,
		afterImage,
		beforeLabel = 'Original',
		afterLabel = 'Processed'
	}: Props = $props();

	let sliderValue = $state(50);
	let isResizing = $state(false);

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		sliderValue = parseInt(target.value);
	}
</script>

<div
	class="group relative w-full overflow-hidden rounded-xl border border-border bg-muted/30 select-none"
	role="group"
	aria-label="Image comparison"
>
	<!-- After Image (Background) -->
	<img src={afterImage} alt={afterLabel} class="block h-auto w-full object-contain" />
	<div
		class="pointer-events-none absolute top-4 right-4 rounded-md bg-black/50 px-2 py-1 text-xs font-medium text-white backdrop-blur-md"
	>
		{afterLabel}
	</div>

	<!-- Before Image (Clipped) -->
	<div class="absolute inset-0 overflow-hidden" style="width: {sliderValue}%">
		<img
			src={beforeImage}
			alt={beforeLabel}
			class="absolute top-0 left-0 h-full w-full max-w-none object-contain"
			style="width: 100cqw;"
		/>
		<div
			class="pointer-events-none absolute top-4 left-4 rounded-md bg-black/50 px-2 py-1 text-xs font-medium text-white backdrop-blur-md"
		>
			{beforeLabel}
		</div>
	</div>

	<!-- Slider Handle -->
	<div
		class="absolute inset-y-0 z-20 w-1 cursor-ew-resize bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)]"
		style="left: {sliderValue}%"
	>
		<div
			class="absolute top-1/2 left-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-primary shadow-lg transition-transform group-hover:scale-110"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"><path d="m9 18 6-6-6-6" /></svg
			>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="absolute rotate-180"><path d="m9 18 6-6-6-6" /></svg
			>
		</div>
	</div>

	<!-- Hidden Range Input -->
	<input
		type="range"
		min="0"
		max="100"
		value={sliderValue}
		oninput={handleInput}
		class="absolute inset-0 z-30 h-full w-full cursor-ew-resize opacity-0"
		aria-label="Compare slider"
	/>
</div>

<style>
	/* Make sure the before image scales relative to the container, not the clipped div */
	:global(.container-query) {
		container-type: inline-size;
	}
</style>
