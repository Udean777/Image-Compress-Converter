<script lang="ts">
	import { Trash2, FileText, HardDrive, AlertCircle, Sparkles, Clock } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';

	let { data } = $props();
</script>

<div class="space-y-6">
	<header class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
		<div>
			<h1 class="text-3xl font-bold tracking-tight text-foreground">Storage Explorer</h1>
			<p class="text-sm text-muted-foreground">
				Manage files in your S3-compatible storage (MinIO).
			</p>
		</div>

		<div class="flex items-center gap-2 rounded-xl border bg-muted p-1">
			<form
				method="POST"
				action="?/cleanup"
				use:enhance={() => {
					return async ({ result }) => {
						// @ts-ignore
						if (result.type === 'success')
							toast.success(`Cleanup successful: ${result.data?.count || 0} files removed`);
						else toast.error('Cleanup failed');
					};
				}}
				class="flex items-center gap-2 px-3 py-1.5"
			>
				<div class="flex flex-col">
					<Label class="mb-1 text-[10px] leading-none font-bold text-muted-foreground uppercase"
						>Retention</Label
					>
					<div class="flex items-center gap-2">
						<Input type="number" name="days" value="7" class="h-7 w-12 bg-background text-xs" />
						<span class="text-xs font-medium text-muted-foreground">days</span>
					</div>
				</div>
				<Button
					type="submit"
					size="sm"
					variant="secondary"
					class="h-8 gap-2 border-none bg-amber-500/10 text-amber-600 shadow-none hover:bg-amber-500/20"
				>
					<Sparkles class="size-3.5" /> Auto-Cleanup
				</Button>
			</form>
		</div>
	</header>

	<!-- Stats Grid -->
	<div class="grid gap-6 md:grid-cols-2">
		<div class="flex items-center gap-4 rounded-xl border bg-card p-6 shadow-sm">
			<div
				class="rounded-full bg-blue-100 p-3 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
			>
				<FileText class="size-6" />
			</div>
			<div>
				<p class="text-sm font-medium text-muted-foreground">Total Files</p>
				<h3 class="text-2xl font-bold">{data.stats.count}</h3>
			</div>
		</div>
		<div class="flex items-center gap-4 rounded-xl border bg-card p-6 shadow-sm">
			<div
				class="rounded-full bg-emerald-100 p-3 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
			>
				<HardDrive class="size-6" />
			</div>
			<div>
				<p class="text-sm font-medium text-muted-foreground">Total Size</p>
				<h3 class="text-2xl font-bold">{data.stats.sizeText}</h3>
			</div>
		</div>
	</div>

	<!-- File List -->
	<div class="rounded-xl border bg-card">
		<div class="overflow-x-auto p-0">
			<table class="w-full text-left text-sm">
				<thead class="bg-muted/40 text-muted-foreground">
					<tr>
						<th class="p-4 font-medium">Path / Filename</th>
						<th class="p-4 text-right font-medium">Size</th>
						<th class="p-4 font-medium">Modified</th>
						<th class="p-4 text-right font-medium">Actions</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-border">
					{#each data.objects as obj}
						<tr class="group transition-colors hover:bg-muted/5">
							<td class="max-w-75 truncate p-4 font-mono text-xs text-foreground">
								{obj.key}
							</td>
							<td class="p-4 text-right whitespace-nowrap text-muted-foreground">
								{obj.sizeText}
							</td>
							<td class="p-4 text-xs whitespace-nowrap text-muted-foreground">
								{obj.lastModified ? new Date(obj.lastModified).toLocaleString() : 'Unknown'}
							</td>
							<td class="p-4 text-right">
								<form
									method="POST"
									action="?/delete"
									use:enhance={() => {
										return ({ result }) => {
											if (result.type === 'success') toast.success('File deleted');
										};
									}}
								>
									<input type="hidden" name="key" value={obj.key} />
									<Button
										type="submit"
										variant="ghost"
										size="icon"
										class="h-8 w-8 text-rose-500 opacity-0 transition-opacity group-hover:opacity-100"
									>
										<Trash2 class="size-4" />
									</Button>
								</form>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
