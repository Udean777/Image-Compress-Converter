<script lang="ts">
	import { enhance } from '$app/forms';
	import { IconClock, IconImage, IconClose, IconInbox, IconCloud } from '$lib/components/icons';
	import { toast } from 'svelte-sonner';
	import { Pin, Clock } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';

	interface HistoryItem {
		id: string;
		fileName?: string | null;
		action?: string | null;
		outputUrl?: string | null;
		expiresAt?: Date | string | null;
		externalUrl?: string | null;
		isPermanent?: boolean;
	}

	interface Props {
		history: HistoryItem[];
	}

	let { history }: Props = $props();

	let hasHistory = $derived(history && history.length > 0);

	function formatExpiryDate(date: Date | string | null | undefined): string {
		if (!date) return '';
		const d = new Date(date);
		const now = new Date();
		const diff = d.getTime() - now.getTime();
		const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
		if (days <= 0) return 'Kadaluarsa';
		if (days === 1) return '1 hari lagi';
		return `${days} hari lagi`;
	}
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
						<div class="flex min-w-0 flex-1 items-center gap-3">
							<a href={item.outputUrl} download class="flex items-center gap-3 min-w-0">
								<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
									<IconImage class="h-5 w-5 text-muted-foreground" />
								</div>
								<div class="min-w-0 flex-1">
									<p class="truncate text-sm font-medium text-foreground">
										{item.fileName || 'Image'}
									</p>
									<div class="flex items-center gap-2 text-xs text-muted-foreground">
										<span>{item.action || 'Processed'}</span>
										{#if item.isPermanent}
											<span
												class="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-primary"
											>
												<Pin class="size-2.5" /> Permanen
											</span>
										{:else if item.expiresAt}
											<span
												class="inline-flex items-center gap-1 rounded bg-yellow-100 px-1.5 py-0.5 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
											>
												<Clock class="size-2.5" />
												{formatExpiryDate(item.expiresAt)}
											</span>
										{/if}
									</div>
								</div>
							</a>

							{#if item.externalUrl}
								<a
									href={item.externalUrl}
									target="_blank"
									class="inline-flex items-center gap-1 rounded bg-blue-100 px-1.5 py-0.5 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 text-[10px]"
									title="View in Google Drive"
								>
									<IconCloud class="size-3" />
									Drive
								</a>
							{/if}
						</div>

						<div class="flex items-center gap-1">
							<!-- Toggle Permanent -->
							<form
								method="POST"
								action="?/togglePermanent"
								use:enhance={() => {
									return async ({ update, result }) => {
										await update();
										if (result.type === 'success') {
											toast.success(
												item.isPermanent ? 'Removed from permanent' : 'Marked as permanent'
											);
										}
									};
								}}
							>
								<input type="hidden" name="historyId" value={item.id} />
								<input type="hidden" name="isPermanent" value={(!item.isPermanent).toString()} />
								<Button
									type="submit"
									variant="ghost"
									size="icon"
									class="h-8 w-8 {item.isPermanent ? 'text-primary' : 'text-muted-foreground'}"
									title={item.isPermanent ? 'Hapus dari permanen' : 'Jadikan permanen'}
								>
									<Pin class="size-4" />
								</Button>
							</form>

							<!-- Delete -->
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
