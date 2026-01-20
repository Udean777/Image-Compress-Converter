<script lang="ts">
	import { IconError } from '$lib/components/icons';
	import { Button } from '$lib/components/ui/button';
</script>

<div class="flex min-h-screen items-center justify-center bg-background p-4">
	<div class="w-full max-w-md space-y-6 text-center">
		<div class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/10">
			<IconError class="size-10 text-rose-500" />
		</div>

		<div class="space-y-2">
			<h1 class="text-3xl font-bold tracking-tight text-foreground">Maintenance Mode</h1>
			<p class="text-muted-foreground">
				We are currently performing scheduled maintenance to improve our service. Please check back
				later.
			</p>
		</div>

		<div class="pt-4">
			<Button variant="outline" onclick={() => window.location.reload()}>Refresh Page</Button>
		</div>
	</div>
</div>
