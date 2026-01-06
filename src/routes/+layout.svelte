<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Image Studio | Compress & Convert</title>
	<meta
		name="description"
		content="Compress and convert your images instantly with our SaaS tool"
	/>
</svelte:head>

{@render children()}
