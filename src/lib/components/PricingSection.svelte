<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Check, Zap } from '@lucide/svelte';
	import { fly } from 'svelte/transition';

	interface Plan {
		id: string;
		name: string;
		displayName: string;
		price: number;
		currency: string;
		interval: string;
		credits: number;
		features: string[];
		isPopular: boolean;
	}

	let { plans = [] }: { plans: Plan[] } = $props();

	const formatPrice = (price: number) => {
		if (price === 0) return 'Free';
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(price);
	};
</script>

<section id="pricing" class="container mx-auto px-6 py-24">
	<div class="mb-16 text-center">
		<h2 class="mb-4 text-4xl font-bold text-foreground">Simple, Transparent Pricing</h2>
		<p class="mx-auto max-w-2xl text-muted-foreground">
			Choose the plan that's right for you. All plans include access to our core features.
		</p>
	</div>

	<div class="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
		{#each plans as plan, i}
			<div
				class="relative flex flex-col rounded-3xl border p-8 transition-all hover:shadow-xl {plan.isPopular
					? 'border-primary ring-1 ring-primary'
					: 'border-border bg-card'}"
				in:fly={{ y: 20, delay: i * 100 }}
			>
				{#if plan.isPopular}
					<div
						class="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold tracking-wider text-primary-foreground uppercase"
					>
						Most Popular
					</div>
				{/if}

				<div class="mb-8">
					<h3 class="text-xl font-bold text-foreground">{plan.displayName}</h3>
					<div class="mt-4 flex items-baseline gap-1">
						<span class="text-4xl font-bold text-foreground">{formatPrice(plan.price)}</span>
						{#if plan.interval !== 'once'}
							<span class="text-muted-foreground">/{plan.interval === 'month' ? 'mo' : 'yr'}</span>
						{/if}
					</div>
					<p class="mt-2 text-sm text-muted-foreground">
						{plan.credits} credits included
					</p>
				</div>

				<ul class="mb-8 flex-1 space-y-4">
					{#each plan.features as feature}
						<li class="flex items-start gap-3 text-sm text-muted-foreground">
							<Check class="h-5 w-5 shrink-0 text-primary" />
							<span>{feature}</span>
						</li>
					{/each}
				</ul>

				<Button
					variant={plan.isPopular ? 'default' : 'outline'}
					class="w-full py-6 text-base font-semibold transition-all hover:scale-[1.02]"
					href={plan.price === 0 ? '/register' : `/dashboard/upgrade?plan=${plan.id}`}
				>
					{#if plan.price === 0}
						Get Started
					{:else}
						Upgrade Now
						<Zap class="ml-2 h-4 w-4 fill-current" />
					{/if}
				</Button>
			</div>
		{/each}
	</div>
</section>
