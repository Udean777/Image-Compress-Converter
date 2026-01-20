<script lang="ts">
	import { cn } from '$lib/utils.js';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		class: className,
		inset = false,
		children,
		...restProps
	}: HTMLAttributes<HTMLDivElement> & { inset?: boolean; children?: Snippet } = $props();
</script>

<div
	class={cn('px-2 py-1.5 text-sm font-semibold text-white', inset && 'pl-8', className)}
	{...restProps}
>
	{@render children?.()}
</div>
