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
	class="rounded-3xl border border-border bg-card p-4 shadow-sm sm:p-6 md:p-8"
	aria-labelledby="history-title"
>
	<div class="mb-5 flex items-center gap-3">
		<div
			class="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30"
		>
			<IconClock class="h-6 w-6 text-primary-foreground" />
		</div>
		<div>
			<h2 id="history-title" class="text-xl font-semibold text-foreground">History</h2>
			<p class="text-sm text-muted-foreground">Your recent transformations</p>
		</div>
	</div>

	{#if hasHistory}
		<ul class="custom-scrollbar max-h-80 space-y-3 overflow-y-auto pr-2">
			{#each history as item (item.id)}
				<li class="rounded-xl border border-border p-4 transition-all duration-200 hover:bg-accent">
					<div class="flex items-center justify-between gap-3">
						<a href={item.outputUrl} download class="flex min-w-0 flex-1 items-center gap-3">
							<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
								<IconImage class="h-5 w-5 text-muted-foreground" />
							</div>
							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-medium text-foreground">
									{item.fileName || 'Image'}
								</p>
								<p class="text-xs text-muted-foreground">{item.action || 'Processed'}</p>
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
							<button
								type="submit"
								class="text-muted-foreground transition-colors hover:text-destructive"
							>
								<IconClose class="h-5 w-5" />
							</button>
						</form>
					</div>
				</li>
			{/each}
		</ul>
	{:else}
		<div class="py-8 text-center">
			<div class="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
				<IconInbox class="h-8 w-8 text-muted-foreground" />
			</div>
			<p class="text-muted-foreground">No history yet</p>
			<p class="mt-1 text-sm text-muted-foreground">Process your first image to get started</p>
		</div>
	{/if}
</section>

<style>
	.custom-scrollbar::-webkit-scrollbar {
		width: 6px;
	}

	.custom-scrollbar::-webkit-scrollbar-track {
		background: transparent;
	}

	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: var(--color-border);
		border-radius: 3px;
	}

	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background: var(--color-muted-foreground);
	}
</style>
