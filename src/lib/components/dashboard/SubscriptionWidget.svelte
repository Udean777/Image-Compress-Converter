<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Zap, Star } from '@lucide/svelte';
	import Progress from '../ui/progress/progress.svelte';

	let { user } = $props();

	const maxCredits = $derived(user.tier === 'free' ? 15 : 100);
	const creditPercentage = $derived((user.credits / maxCredits) * 100);
</script>

<div class="space-y-4 px-4 py-4">
	<div class="rounded-xl border border-primary/20 bg-primary/5 p-4 backdrop-blur-sm">
		<div class="mb-3 flex items-center justify-between">
			<div class="flex items-center gap-2">
				<div class="rounded-lg bg-primary p-1.5 text-primary-foreground">
					<Star class="size-3.5 fill-current" />
				</div>
				<span class="text-xs font-bold tracking-wider text-primary uppercase">{user.planName}</span>
			</div>
			<span class="text-xs font-medium text-muted-foreground">{user.credits} sisa</span>
		</div>

		<Progress value={creditPercentage} class="mb-4 h-1.5" />

		<div class="flex w-full flex-col gap-4">
			{#if user.tier !== 'free'}
				<Button
					href="/dashboard/billing"
					variant="outline"
					size="sm"
					class="w-full gap-2 border-primary/20 text-xs font-bold hover:bg-primary/10"
				>
					Kelola Paket & Invoice
				</Button>
			{/if}

			<Button href="/dashboard/upgrade" size="sm" class="w-full gap-2 text-xs font-bold">
				<Zap class="size-3 fill-current" />
				{user.tier === 'free' ? 'Upgrade Pro' : 'Lihat Paket Lain'}
			</Button>
		</div>
	</div>
</div>
