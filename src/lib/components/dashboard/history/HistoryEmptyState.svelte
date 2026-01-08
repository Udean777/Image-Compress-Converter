<script lang="ts">
	import { IconInbox } from '$lib/components/icons';
</script>

<div class="rounded-3xl border border-border bg-card p-12 text-center shadow-sm">
	<div class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
		<IconInbox class="h-10 w-10 text-muted-foreground" />
	</div>
	<h2 class="text-xl font-semibold text-foreground">No history yet</h2>
	<p class="mt-2 text-muted-foreground">Process your first image to see it here</p>
	<a
		href="/dashboard"
		class="mt-6 inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-violet-600 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:from-violet-500 hover:to-purple-500"
	>
		Go to Dashboard
	</a>
</div>
