<script lang="ts">
	import { IconDownload, IconTrash, IconLoader } from '$lib/components/icons';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Button } from '$lib/components/ui/button';
	import { enhance } from '$app/forms';

	let {
		selectedIds = $bindable([]),
		data
	}: {
		selectedIds: string[];
		data: { history: any[] };
	} = $props();

	let showBulkDeleteDialog = $state(false);
	let isDeleting = $state(false);

	async function bulkDownload() {
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
</script>

{#if selectedIds.length > 0}
	<div class="flex animate-in items-center gap-2 fade-in slide-in-from-top-2">
		<span class="mr-2 text-sm font-medium text-slate-400">
			{selectedIds.length} items selected
		</span>
		<button
			onclick={bulkDownload}
			class="inline-flex items-center gap-2 rounded-lg bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-400 transition-all hover:bg-emerald-500/30"
		>
			<IconDownload class="h-4 w-4" />
			Download All
		</button>
		<AlertDialog.Root bind:open={showBulkDeleteDialog}>
			<AlertDialog.Trigger>
				<button
					class="inline-flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive transition-all hover:bg-destructive/20"
				>
					<IconTrash class="h-4 w-4" />
					Delete All
				</button>
			</AlertDialog.Trigger>
			<AlertDialog.Content class="border-border bg-background text-foreground">
				<AlertDialog.Header>
					<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
					<AlertDialog.Description class="text-muted-foreground">
						This will permanently delete {selectedIds.length} items from your history. This action cannot
						be undone.
					</AlertDialog.Description>
				</AlertDialog.Header>
				<AlertDialog.Footer>
					<AlertDialog.Cancel
						class="border-border bg-secondary text-secondary-foreground hover:bg-secondary/80"
					>
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
