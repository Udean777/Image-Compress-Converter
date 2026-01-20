<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { ModeWatcher } from 'mode-watcher';
	import { Megaphone, X, Info, AlertTriangle, CheckCircle2 } from '@lucide/svelte';
	import { onMount } from 'svelte';

	let { children, data } = $props();
	let dismissedIds = $state<string[]>([]);

	onMount(() => {
		dismissedIds = JSON.parse(localStorage.getItem('dismissed_announcements') || '[]');
	});

	function dismiss(id: string) {
		dismissedIds = [...dismissedIds, id];
		localStorage.setItem('dismissed_announcements', JSON.stringify(dismissedIds));
	}

	const activeAnnouncements = $derived(
		(data.announcements || []).filter((a: any) => !dismissedIds.includes(a.id))
	);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Image Studio | Compress & Convert</title>
	<meta
		name="description"
		content="Compress and convert your images instantly with our SaaS tool"
	/>
</svelte:head>

{#if data.user?.isImpersonating}
	<div class="sticky top-0 z-100 bg-blue-600 px-4 py-2 text-white shadow-lg">
		<div class="mx-auto flex max-w-7xl items-center justify-between gap-4">
			<div class="flex items-center gap-2 text-sm font-medium">
				<span
					class="rounded bg-blue-500 px-1.5 py-0.5 text-[10px] tracking-wider text-white uppercase"
				>
					Impersonating
				</span>
				<span>Viewing as <strong>{data.user.email}</strong></span>
			</div>
			<form action="/api/impersonate/stop" method="POST">
				<button
					type="submit"
					class="rounded-md bg-white/10 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-white/20"
				>
					Stop Viewing
				</button>
			</form>
		</div>
	</div>
{/if}

{#each activeAnnouncements as a}
	<div
		class="sticky top-0 z-50 border-b px-4 py-3 shadow-sm {a.type === 'warning'
			? 'bg-amber-500 text-white'
			: a.type === 'success'
				? 'bg-green-600 text-white'
				: 'bg-primary text-primary-foreground'}"
	>
		<div class="mx-auto flex max-w-7xl items-center justify-between gap-4">
			<div class="flex items-center gap-3">
				<div class="rounded-lg bg-white/20 p-1.5">
					{#if a.type === 'warning'}
						<AlertTriangle class="size-4" />
					{:else if a.type === 'success'}
						<CheckCircle2 class="size-4" />
					{:else}
						<Megaphone class="size-4" />
					{/if}
				</div>
				<div class="flex flex-col sm:flex-row sm:items-center sm:gap-2">
					<span class="font-bold">{a.title}</span>
					<span class="text-sm opacity-90">{a.content}</span>
				</div>
			</div>
			<button
				onclick={() => dismiss(a.id)}
				class="rounded-full p-1 transition-colors hover:bg-white/20"
				title="Dismiss"
			>
				<X class="size-4" />
			</button>
		</div>
	</div>
{/each}

<ModeWatcher />

{@render children()}
