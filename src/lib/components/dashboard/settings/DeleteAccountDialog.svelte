<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
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
							<button
								type="button"
								class="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
								onclick={() => (showDeletePassword = !showDeletePassword)}
							>
								{#if showDeletePassword}
									<IconEyeOff class="h-5 w-5" />
								{:else}
									<IconEye class="h-5 w-5" />
								{/if}
							</button>
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

		<Dialog.Footer class="gap-2 sm:gap-0">
			<button
				type="button"
				onclick={() => (open = false)}
				class="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
			>
				Cancel
			</button>
			{#if deleteStep === 1}
				<button
					onclick={() => (deleteStep = 2)}
					disabled={!deletePassword}
					class="rounded-lg bg-secondary px-6 py-2 text-sm font-semibold text-secondary-foreground transition-all hover:bg-secondary/80 disabled:opacity-50"
				>
					Next Step
				</button>
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
					<button
						type="submit"
						disabled={loading}
						class="text-destructive-foreground w-full rounded-lg bg-destructive px-6 py-2 text-sm font-semibold shadow-lg transition-all hover:bg-destructive/90 disabled:opacity-50"
					>
						{#if loading}
							<IconLoader class="mr-2 h-4 w-4 animate-spin" />
							Deleting...
						{:else}
							Permanently Delete My Account
						{/if}
					</button>
				</form>
			{/if}
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
