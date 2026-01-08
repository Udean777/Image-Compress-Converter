<script lang="ts">
	import type { PageProps } from './$types';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import {
		IconClock,
		IconDownload,
		IconImage,
		IconInbox,
		IconTrash,
		IconLoader
	} from '$lib/components/icons';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { enhance } from '$app/forms';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Button } from '$lib/components/ui/button';

	let { data }: PageProps = $props();

	let selectedIds = $state<string[]>([]);
	let isDeleting = $state(false);
	let itemToDelete = $state<string | null>(null);
	let showSingleDeleteDialog = $state(false);
	let showBulkDeleteDialog = $state(false);

	const isAllSelected = $derived(
		data.history.length > 0 && selectedIds.length === data.history.length
	);

	function toggleAll() {
		if (isAllSelected) {
			selectedIds = [];
		} else {
			selectedIds = data.history.map((item) => item.id);
		}
	}

	function toggleSelect(id: string) {
		if (selectedIds.includes(id)) {
			selectedIds = selectedIds.filter((i) => i !== id);
		} else {
			selectedIds = [...selectedIds, id];
		}
	}

	async function downloadMassal() {
		const selectedItems = data.history.filter((item) => selectedIds.includes(item.id));
		for (const item of selectedItems) {
			const link = document.createElement('a');
			link.href = item.outputUrl;
			link.download = item.fileName || 'Image';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			// Small delay to prevent browser issues with multiple downloads
			await new Promise((resolve) => setTimeout(resolve, 200));
		}
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('id-ID', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="space-y-6">
	<header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div class="flex items-center gap-3">
			<div
				class="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30"
			>
				<IconClock class="h-6 w-6 text-white" />
			</div>
			<div>
				<h1 class="text-2xl font-bold text-white">History</h1>
				<p class="text-slate-400">All your image transformations</p>
			</div>
		</div>

		{#if selectedIds.length > 0}
			<div class="flex animate-in items-center gap-2 fade-in slide-in-from-top-2">
				<span class="mr-2 text-sm font-medium text-slate-400">
					{selectedIds.length} items selected
				</span>
				<button
					onclick={downloadMassal}
					class="inline-flex items-center gap-2 rounded-lg bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-400 transition-all hover:bg-emerald-500/30"
				>
					<IconDownload class="h-4 w-4" />
					Download All
				</button>
				<AlertDialog.Root bind:open={showBulkDeleteDialog}>
					<AlertDialog.Trigger>
						<button
							class="inline-flex items-center gap-2 rounded-lg bg-rose-500/20 px-4 py-2 text-sm font-medium text-rose-400 transition-all hover:bg-rose-500/30"
						>
							<IconTrash class="h-4 w-4" />
							Delete All
						</button>
					</AlertDialog.Trigger>
					<AlertDialog.Content class="border-white/10 bg-slate-900 text-white">
						<AlertDialog.Header>
							<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
							<AlertDialog.Description class="text-slate-400">
								This will permanently delete {selectedIds.length} items from your history. This action
								cannot be undone.
							</AlertDialog.Description>
						</AlertDialog.Header>
						<AlertDialog.Footer>
							<AlertDialog.Cancel class="border-white/10 bg-white/5 text-white hover:bg-white/10">
								Cancel
							</AlertDialog.Cancel>
							<form
								action="?/bulkDelete"
								method="POST"
								use:enhance={() => {
									isDeleting = true;
									return async ({ update }) => {
										await update();
										selectedIds = [];
										isDeleting = false;
										showBulkDeleteDialog = false;
									};
								}}
							>
								<input type="hidden" name="ids" value={selectedIds.join(',')} />
								<AlertDialog.Action>
									<Button
										type="submit"
										disabled={isDeleting}
										class="bg-rose-600 text-white hover:bg-rose-500"
									>
										{#if isDeleting}
											<IconLoader class="mr-2 h-4 w-4 animate-spin" />
										{/if}
										Delete {selectedIds.length} Items
									</Button>
								</AlertDialog.Action>
							</form>
						</AlertDialog.Footer>
					</AlertDialog.Content>
				</AlertDialog.Root>
			</div>
		{/if}
	</header>

	{#if data.history && data.history.length > 0}
		<div
			class="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl"
		>
			<Table>
				<TableHeader>
					<TableRow class="border-white/10 bg-white/5">
						<TableHead class="w-12 px-4">
							<Checkbox
								checked={isAllSelected}
								onCheckedChange={toggleAll}
								aria-label="Select all"
							/>
						</TableHead>
						<TableHead class="px-6 py-4 text-sm font-semibold text-slate-300">File</TableHead>
						<TableHead class="px-6 py-4 text-sm font-semibold text-slate-300">Action</TableHead>
						<TableHead class="px-6 py-4 text-sm font-semibold text-slate-300">Format</TableHead>
						<TableHead class="px-6 py-4 text-sm font-semibold text-slate-300">Date</TableHead>
						<TableHead class="px-6 py-4 text-right text-sm font-semibold text-slate-300">
							Actions
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each data.history as item (item.id)}
						<TableRow
							class="border-white/5 transition-colors {selectedIds.includes(item.id)
								? 'bg-white/10'
								: ''}"
						>
							<TableCell class="px-4">
								<Checkbox
									checked={selectedIds.includes(item.id)}
									onCheckedChange={() => toggleSelect(item.id)}
									aria-label="Select row"
								/>
							</TableCell>
							<TableCell class="px-6 py-4">
								<div class="flex items-center gap-3">
									<div
										class="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-slate-600 to-slate-700"
									>
										<IconImage class="h-5 w-5 text-slate-300" />
									</div>
									<span class="max-w-50 truncate text-sm font-medium text-white">
										{item.fileName || 'Image'}
									</span>
								</div>
							</TableCell>
							<TableCell class="px-6 py-4">
								<span
									class="rounded-full bg-violet-500/20 px-3 py-1 text-xs font-medium text-violet-300"
								>
									{item.action || 'Processed'}
								</span>
							</TableCell>
							<TableCell class="px-6 py-4">
								<span class="text-sm text-slate-400 uppercase">{item.outputFormat || '-'}</span>
							</TableCell>
							<TableCell class="px-6 py-4">
								<span class="text-sm text-slate-400">{formatDate(item.createdAt)}</span>
							</TableCell>
							<TableCell class="px-6 py-4">
								<div class="flex items-center justify-end gap-2">
									<a
										href={item.outputUrl}
										download
										class="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 transition-colors hover:bg-emerald-500/30"
										title="Download"
									>
										<IconDownload class="h-4 w-4" />
									</a>

									<AlertDialog.Root
										open={showSingleDeleteDialog && itemToDelete === item.id}
										onOpenChange={(open) => {
											if (!open) {
												showSingleDeleteDialog = false;
												itemToDelete = null;
											}
										}}
									>
										<AlertDialog.Trigger>
											<button
												onclick={() => {
													itemToDelete = item.id;
													showSingleDeleteDialog = true;
												}}
												class="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400 transition-colors hover:bg-rose-500/30"
												title="Delete"
											>
												<IconTrash class="h-4 w-4" />
											</button>
										</AlertDialog.Trigger>
										<AlertDialog.Content class="border-white/10 bg-slate-900 text-white">
											<AlertDialog.Header>
												<AlertDialog.Title>Delete this item?</AlertDialog.Title>
												<AlertDialog.Description class="text-slate-400">
													Are you sure you want to delete <span class="font-medium text-white"
														>{item.fileName || 'this image'}</span
													>? This action cannot be undone.
												</AlertDialog.Description>
											</AlertDialog.Header>
											<AlertDialog.Footer>
												<AlertDialog.Cancel
													class="border-white/10 bg-white/5 text-white hover:bg-white/10"
												>
													Cancel
												</AlertDialog.Cancel>
												<form
													action="?/delete"
													method="POST"
													use:enhance={() => {
														isDeleting = true;
														return async ({ update }) => {
															await update();
															selectedIds = selectedIds.filter((id) => id !== item.id);
															isDeleting = false;
															showSingleDeleteDialog = false;
															itemToDelete = null;
														};
													}}
												>
													<input type="hidden" name="id" value={item.id} />
													<AlertDialog.Action>
														<Button
															type="submit"
															disabled={isDeleting}
															class="bg-rose-600 text-white hover:bg-rose-500"
														>
															{#if isDeleting}
																<IconLoader class="mr-2 h-4 w-4 animate-spin" />
															{/if}
															Delete Item
														</Button>
													</AlertDialog.Action>
												</form>
											</AlertDialog.Footer>
										</AlertDialog.Content>
									</AlertDialog.Root>
								</div>
							</TableCell>
						</TableRow>
					{/each}
				</TableBody>
			</Table>
		</div>
	{:else}
		<div class="rounded-3xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-xl">
			<div class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/5">
				<IconInbox class="h-10 w-10 text-slate-500" />
			</div>
			<h2 class="text-xl font-semibold text-white">No history yet</h2>
			<p class="mt-2 text-slate-400">Process your first image to see it here</p>
			<a
				href="/dashboard"
				class="mt-6 inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-violet-600 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:from-violet-500 hover:to-purple-500"
			>
				Go to Dashboard
			</a>
		</div>
	{/if}
</div>
