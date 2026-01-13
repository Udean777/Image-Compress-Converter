<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';

	let { data } = $props();
	let loadingId = $state<string | null>(null);
</script>

<div class="space-y-6">
	<header>
		<h1 class="text-3xl font-bold tracking-tight text-foreground">Pricing & Credits Manager</h1>
		<p class="text-muted-foreground">Adjust platform pricing and credit allocations.</p>
	</header>

	<div class="grid gap-6">
		{#each data.plans as plan}
			<div class="rounded-xl border bg-card p-6 shadow-sm">
				<form
					method="POST"
					action="?/update"
					use:enhance={() => {
						loadingId = plan.id;
						return ({ result }) => {
							loadingId = null;
							if (result.type === 'success') toast.success('Plan updated');
						};
					}}
					class="space-y-4"
				>
					<input type="hidden" name="id" value={plan.id} />

					<div class="flex flex-col items-end gap-4 md:flex-row">
						<div class="flex-1 space-y-2">
							<Label for="name-{plan.id}">Plan Name</Label>
							<Input id="name-{plan.id}" name="displayName" value={plan.displayName} />
						</div>

						<div class="w-full space-y-2 md:w-40">
							<Label for="price-{plan.id}">Price (IDR)</Label>
							<div class="relative">
								<span
									class="absolute top-1/2 left-3 -translate-y-1/2 text-xs font-medium text-muted-foreground"
									>Rp</span
								>
								<Input
									id="price-{plan.id}"
									name="price"
									type="number"
									value={plan.price}
									class="pl-8"
								/>
							</div>
						</div>

						<div class="w-full space-y-2 md:w-32">
							<Label for="credits-{plan.id}">Credits</Label>
							<Input id="credits-{plan.id}" name="credits" type="number" value={plan.credits} />
						</div>

						<Button type="submit" disabled={loadingId === plan.id}>
							{loadingId === plan.id ? 'Saving...' : 'Save Changes'}
						</Button>
					</div>
				</form>
			</div>
		{/each}
	</div>
</div>
