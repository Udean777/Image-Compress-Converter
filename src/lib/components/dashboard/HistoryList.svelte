<script lang="ts">
	import { enhance } from '$app/forms';
	import { IconClock, IconImage, IconClose, IconInbox } from '$lib/components/icons';
	import { toast } from 'svelte-sonner';

	interface HistoryItem {
		id: string;
		fileName?: string | null;
		action?: string | null;
		outputUrl?: string | null;
	}

	interface Props {
		history: HistoryItem[];
	}

	let { history }: Props = $props();

	let hasHistory = $derived(history && history.length > 0);
</script>

<section
	class="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl md:p-8"
	aria-labelledby="history-title"
>
	<div class="mb-5 flex items-center gap-3">
		<div
			class="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30"
		>
			<IconClock class="h-6 w-6 text-white" />
		</div>
		<div>
			<h2 id="history-title" class="text-xl font-semibold text-white">History</h2>
			<p class="text-sm text-slate-400">Your recent transformations</p>
		</div>
	</div>

	{#if hasHistory}
		<ul class="custom-scrollbar max-h-80 space-y-3 overflow-y-auto pr-2">
			{#each history as item (item.id)}
				<li
					class="rounded-xl border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:bg-white/10"
				>
					<div class="flex items-center justify-between">
						<a href={item.outputUrl} download class="flex items-center gap-3">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-slate-600 to-slate-700"
							>
								<IconImage class="h-5 w-5 text-slate-300" />
							</div>
							<div>
								<p class="text-sm font-medium text-white">{item.fileName || 'Image'}</p>
								<p class="text-xs text-slate-400">{item.action || 'Processed'}</p>
							</div>
						</a>
						<form
							method="POST"
							action="?/delete"
							use:enhance={() => {
								return async ({ update, result }) => {
									await update();
									if (result.type === 'success') {
										toast.success('History item deleted');
									} else if (result.type === 'failure') {
										const msg = result.data?.message;
										toast.error(typeof msg === 'string' ? msg : 'Failed to delete item');
									}
								};
							}}
						>
							<input type="hidden" name="historyId" value={item.id} />
							<button type="submit" class="text-violet-400 transition-colors hover:text-red-400">
								<IconClose class="h-5 w-5" />
							</button>
						</form>
					</div>
				</li>
			{/each}
		</ul>
	{:else}
		<div class="py-8 text-center">
			<div class="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
				<IconInbox class="h-8 w-8 text-slate-500" />
			</div>
			<p class="text-slate-500">No history yet</p>
			<p class="mt-1 text-sm text-slate-600">Process your first image to get started</p>
		</div>
	{/if}
</section>

<style>
	.custom-scrollbar::-webkit-scrollbar {
		width: 6px;
	}

	.custom-scrollbar::-webkit-scrollbar-track {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 3px;
	}

	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.2);
		border-radius: 3px;
	}

	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.3);
	}
</style>
