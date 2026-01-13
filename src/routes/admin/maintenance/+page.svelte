<script lang="ts">
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Label } from '$lib/components/ui/label';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { IconError } from '$lib/components/icons';

	let { data } = $props();
	let isMaintenance = $state(false);

	$effect(() => {
		isMaintenance = data.isMaintenance;
	});
</script>

<div class="space-y-6">
	<header>
		<h1 class="text-3xl font-bold tracking-tight text-foreground">Maintenance Mode</h1>
		<p class="text-muted-foreground">Control platform availability for maintenance purposes.</p>
	</header>

	<div class="max-w-2xl rounded-xl border border-border bg-card p-8 shadow-sm">
		<div
			class="mb-8 flex items-start gap-4 rounded-lg border border-rose-500/20 bg-rose-500/10 p-4"
		>
			<IconError class="mt-0.5 size-6 shrink-0 text-rose-500" />
			<div class="space-y-1">
				<h3 class="text-lg font-semibold text-rose-500">Caution: Global Impact</h3>
				<p class="text-sm text-muted-foreground">
					Enabling Maintenance Mode will immediately prevent regular users from accessing the
					platform. Only users with the <strong>ADMIN</strong> role will be able to navigate and use the
					system.
				</p>
			</div>
		</div>

		<form
			method="POST"
			action="?/toggle"
			use:enhance={({ formData }) => {
				const active = !isMaintenance;
				formData.set('active', String(active));
				// Optimistic update
				isMaintenance = active;

				return ({ result }) => {
					if (result.type !== 'success') {
						isMaintenance = !active;
						toast.error('Failed to update maintenance mode');
					} else {
						toast.success(`Maintenance mode ${active ? 'enabled' : 'disabled'}`);
					}
				};
			}}
			class="flex items-center justify-between rounded-xl border bg-muted/30 p-4"
		>
			<div class="space-y-1">
				<Label for="maintenance-toggle" class="text-base font-semibold">Active Maintenance</Label>
				<p class="text-xs text-muted-foreground">
					{isMaintenance
						? 'The platform is currently in maintenance mode'
						: 'The platform is currently online and active'}
				</p>
			</div>

			<div class="flex h-full items-center">
				<Checkbox id="maintenance-toggle" checked={isMaintenance} />
				<button
					type="submit"
					class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
					aria-label="Toggle Maintenance Mode"
				></button>
			</div>
		</form>
	</div>
</div>
