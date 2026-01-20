<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';
	import type { Snippet } from 'svelte';

	let {
		class: className,
		inset = false,
		children,
		...restProps
	}: DropdownMenuPrimitive.ItemProps & { inset?: boolean; children?: Snippet } = $props();
</script>

<DropdownMenuPrimitive.Item
	class={cn(
		'relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none',
		'focus:bg-primary/10 focus:text-primary',
		'data-disabled:pointer-events-none data-disabled:opacity-50',
		'[&>svg]:size-4 [&>svg]:shrink-0',
		inset && 'pl-8',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</DropdownMenuPrimitive.Item>
