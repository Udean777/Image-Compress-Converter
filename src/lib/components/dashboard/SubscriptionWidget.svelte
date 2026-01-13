<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Zap, Star } from '@lucide/svelte';
	import Progress from '../ui/progress/progress.svelte';

	let { user } = $props();

	// Sesuaikan dengan seed-pricing.ts: free=15, starter=100, pro=300, business=1000
	const TIER_CREDITS: Record<string, number> = {
		free: 15,
		starter: 100,
		pro: 300,
		business: 1000
	};

	const tier = $derived(user.planTier || 'free');
	const maxCredits = $derived(TIER_CREDITS[tier] || 15);
	const creditPercentage = $derived(Math.min((user.credits / maxCredits) * 100, 100));
</script>

<div class="space-y-4 px-4 py-4">
	<div class="rounded-xl border border-primary/20 bg-primary/5 p-4 backdrop-blur-sm">
		<div class="mb-3 flex flex-col items-start gap-2">
			<div class="flex items-center gap-2">
				<div class="rounded-lg bg-primary p-1.5 text-primary-foreground">
					<Star class="size-3.5 fill-current" />
				</div>
				<span class="text-xs font-bold tracking-wider text-primary uppercase">{user.planName}</span>
			</div>
			<span class="truncate text-xs font-medium whitespace-break-spaces text-muted-foreground"
				>{user.credits} / {maxCredits} Credit</span
			>
		</div>

		<Progress value={creditPercentage} class="mb-4 h-1.5" />

		<div class="flex w-full flex-col gap-4">
			{#if tier !== 'free'}
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
				{tier === 'free' ? 'Upgrade Pro' : 'Lihat Paket Lain'}
			</Button>
		</div>
	</div>
</div>
