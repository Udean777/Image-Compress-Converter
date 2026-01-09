<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { IconEye, IconEyeOff, IconError, IconLoader } from '$lib/components/icons';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';

	let {
		open = $bindable(false)
	}: {
		open: boolean;
	} = $props();

	let deleteStep = $state(1); // 1: Password, 2: Final Warning
	let deletePassword = $state('');
	let showDeletePassword = $state(false);
	let loading = $state(false);

	// Reset state when dialog opens
	$effect(() => {
		if (open) {
			deleteStep = 1;
			deletePassword = '';
			showDeletePassword = false;
		}
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="border-border bg-background sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="text-xl font-semibold text-destructive">Delete Account</Dialog.Title>
			<Dialog.Description class="text-muted-foreground">
				{#if deleteStep === 1}
					Please verify your identity to proceed with account deletion.
				{:else}
					Final confirmation. This action cannot be undone.
				{/if}
			</Dialog.Description>
		</Dialog.Header>

		<div class="py-4">
			{#if deleteStep === 1}
				<div class="space-y-4">
					<div class="space-y-2">
						<label for="deletePassword" class="text-sm font-medium text-muted-foreground">
							Confirm your password
						</label>
						<div class="relative">
							<input
								type={showDeletePassword ? 'text' : 'password'}
								id="deletePassword"
								name="password"
								bind:value={deletePassword}
								placeholder="Enter your password"
								class="w-full rounded-xl border border-input bg-background px-4 py-3 pr-12 text-foreground placeholder:text-muted-foreground/70 focus:border-destructive/50 focus:ring-4 focus:ring-destructive/10 focus:outline-hidden"
							/>
							<Button
								variant="ghost"
								size="icon"
								type="button"
								class="absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2 text-muted-foreground hover:text-foreground"
								onclick={() => (showDeletePassword = !showDeletePassword)}
							>
								{#if showDeletePassword}
									<IconEyeOff class="h-4 w-4" />
								{:else}
									<IconEye class="h-4 w-4" />
								{/if}
							</Button>
						</div>
					</div>
				</div>
			{:else}
				<div class="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
					<div class="flex gap-3">
						<IconError class="h-5 w-5 shrink-0 text-destructive" />
						<div class="space-y-2">
							<p class="text-sm font-medium text-destructive">Are you absolutely sure?</p>
							<p class="text-xs leading-relaxed text-muted-foreground">
								Deleting your account will remove all your data from our servers. This includes your
								profile, credits, and all historical records. You will not be able to recover them.
							</p>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<Dialog.Footer class="gap-2">
			<Button variant="ghost" type="button" onclick={() => (open = false)}>Cancel</Button>
			{#if deleteStep === 1}
				<Button variant="secondary" onclick={() => (deleteStep = 2)} disabled={!deletePassword}>
					Next Step
				</Button>
			{:else}
				<form
					method="POST"
					action="?/deleteAccount"
					use:enhance={() => {
						loading = true;
						return async ({ result }) => {
							loading = false;
							if (result.type === 'redirect') {
								window.location.href = result.location;
							} else if (result.type === 'failure') {
								const message = result.data?.message;
								toast.error(typeof message === 'string' ? message : 'Failed to delete account');
								deleteStep = 1; // Go back to password step
							}
						};
					}}
				>
					<input type="hidden" name="password" value={deletePassword} />
					<Button variant="destructive" type="submit" disabled={loading} class="w-full shadow-lg">
						{#if loading}
							<IconLoader class="mr-2 h-4 w-4 animate-spin" />
							Deleting...
						{:else}
							Permanently Delete My Account
						{/if}
					</Button>
				</form>
			{/if}
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
