<script lang="ts">
	import type { PageProps } from './$types';
	import { IconClock, IconImage, IconDownload, IconInbox } from '$lib/components/icons';

	let { data }: PageProps = $props();

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
	<header class="flex items-center gap-3">
		<div
			class="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30"
		>
			<IconClock class="h-6 w-6 text-white" />
		</div>
		<div>
			<h1 class="text-2xl font-bold text-white">History</h1>
			<p class="text-slate-400">All your image transformations</p>
		</div>
	</header>

	{#if data.history && data.history.length > 0}
		<div class="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
			<table class="w-full">
				<thead>
					<tr class="border-b border-white/10 bg-white/5">
						<th class="px-6 py-4 text-left text-sm font-semibold text-slate-300">File</th>
						<th class="px-6 py-4 text-left text-sm font-semibold text-slate-300">Action</th>
						<th class="px-6 py-4 text-left text-sm font-semibold text-slate-300">Format</th>
						<th class="px-6 py-4 text-left text-sm font-semibold text-slate-300">Date</th>
						<th class="px-6 py-4 text-right text-sm font-semibold text-slate-300">Download</th>
					</tr>
				</thead>
				<tbody>
					{#each data.history as item (item.id)}
						<tr class="border-b border-white/5 transition-colors hover:bg-white/5">
							<td class="px-6 py-4">
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
							</td>
							<td class="px-6 py-4">
								<span
									class="rounded-full bg-violet-500/20 px-3 py-1 text-xs font-medium text-violet-300"
								>
									{item.action || 'Processed'}
								</span>
							</td>
							<td class="px-6 py-4">
								<span class="text-sm text-slate-400 uppercase">{item.outputFormat || '-'}</span>
							</td>
							<td class="px-6 py-4">
								<span class="text-sm text-slate-400">{formatDate(item.createdAt)}</span>
							</td>
							<td class="px-6 py-4 text-right">
								<a
									href={item.outputUrl}
									download
									class="inline-flex items-center gap-2 rounded-lg bg-emerald-500/20 px-3 py-2 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/30"
								>
									<IconDownload class="h-4 w-4" />
									Download
								</a>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
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
