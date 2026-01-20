<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';

	let { children, ...restProps }: DropdownMenuPrimitive.TriggerProps & { children?: Snippet } =
		$props();
</script>

<DropdownMenuPrimitive.Trigger {...restProps}>
	{@render children?.()}
</DropdownMenuPrimitive.Trigger>
