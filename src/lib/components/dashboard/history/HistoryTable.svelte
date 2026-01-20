<script lang="ts">
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { IconImage, IconDownload, IconTrash, IconLoader } from '$lib/components/icons';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { enhance } from '$app/forms';

	let {
		history,
		selectedIds = $bindable([])
	}: {
		history: any[];
		selectedIds: string[];
	} = $props();

	let isDeleting = $state(false);
	let itemToDelete = $state<string | null>(null);
	let showSingleDeleteDialog = $state(false);

	const isAllSelected = $derived(history.length > 0 && selectedIds.length === history.length);

	function toggleAll() {
		if (isAllSelected) {
			selectedIds = [];
		} else {
			selectedIds = history.map((item) => item.id);
		}
	}

	function toggleSelect(id: string) {
		if (selectedIds.includes(id)) {
			selectedIds = selectedIds.filter((i) => i !== id);
		} else {
			selectedIds = [...selectedIds, id];
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

	function getFileName(path: string | undefined): string {
		if (!path) return 'Image';
		return path.split('/').pop() || path;
	}
</script>

<div class="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
	<Table>
		<TableHeader>
			<TableRow class="border-border bg-muted/50 hover:bg-muted/50">
				<TableHead class="w-12 px-4">
					<Checkbox checked={isAllSelected} onCheckedChange={toggleAll} aria-label="Select all" />
				</TableHead>
				<TableHead class="px-6 py-4 text-sm font-semibold text-muted-foreground">File</TableHead>
				<TableHead class="px-6 py-4 text-sm font-semibold text-muted-foreground">Action</TableHead>
				<TableHead class="px-6 py-4 text-sm font-semibold text-muted-foreground">Format</TableHead>
				<TableHead class="px-6 py-4 text-sm font-semibold text-muted-foreground">Date</TableHead>
				<TableHead class="px-6 py-4 text-right text-sm font-semibold text-muted-foreground">
					Actions
				</TableHead>
			</TableRow>
		</TableHeader>
		<TableBody>
			{#each history as item (item.id)}
				<TableRow
					class="border-border transition-colors hover:bg-muted/50 {selectedIds.includes(item.id)
						? 'bg-muted/30'
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
							<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
								<IconImage class="h-5 w-5 text-muted-foreground" />
							</div>
							<span class="max-w-50 truncate text-sm font-medium text-foreground">
								{getFileName(item.fileName)}
							</span>
						</div>
					</TableCell>
					<TableCell class="px-6 py-4">
						<span class="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
							{item.action || 'Processed'}
						</span>
					</TableCell>
					<TableCell class="px-6 py-4">
						<span class="text-sm text-muted-foreground uppercase">{item.outputFormat || '-'}</span>
					</TableCell>
					<TableCell class="px-6 py-4">
						<span class="text-sm text-muted-foreground">{formatDate(item.createdAt)}</span>
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

							<Dialog.Root
								open={showSingleDeleteDialog && itemToDelete === item.id}
								onOpenChange={(open) => {
									if (!open) {
										showSingleDeleteDialog = false;
										itemToDelete = null;
									}
								}}
							>
								<Dialog.Trigger>
									<button
										onclick={() => {
											itemToDelete = item.id;
											showSingleDeleteDialog = true;
										}}
										class="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive transition-colors hover:bg-destructive/20"
										title="Delete"
									>
										<IconTrash class="h-4 w-4" />
									</button>
								</Dialog.Trigger>
								<Dialog.Content class="border-border bg-background text-foreground">
									<Dialog.Header>
										<Dialog.Title>Delete this item?</Dialog.Title>
										<Dialog.Description class="text-muted-foreground">
											Are you sure you want to delete <span class="font-medium text-foreground"
												>{getFileName(item.fileName)}</span
											>? This action cannot be undone.
										</Dialog.Description>
									</Dialog.Header>
									<Dialog.Footer>
										<Button
											variant="secondary"
											onclick={() => {
												showSingleDeleteDialog = false;
												itemToDelete = null;
											}}
											class="border-border bg-secondary text-secondary-foreground hover:bg-secondary/80"
										>
											Cancel
										</Button>
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
											<Button
												variant="destructive"
												type="submit"
												disabled={isDeleting}
												class="w-full"
											>
												{#if isDeleting}
													<IconLoader class="mr-2 h-4 w-4 animate-spin" />
												{/if}
												Delete Item
											</Button>
										</form>
									</Dialog.Footer>
								</Dialog.Content>
							</Dialog.Root>
						</div>
					</TableCell>
				</TableRow>
			{/each}
		</TableBody>
	</Table>
</div>
