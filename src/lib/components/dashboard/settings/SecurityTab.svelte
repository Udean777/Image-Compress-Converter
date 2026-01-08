<script lang="ts">
	import { IconLock, IconTrash, IconEye, IconEyeOff, IconLoader } from '$lib/components/icons';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import DeleteAccountDialog from './DeleteAccountDialog.svelte';

	let loading = $state(false);

	// Change Password UX State
	let showCurrentPassword = $state(false);
	let showNewPassword = $state(false);
	let showConfirmPassword = $state(false);
	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let passwordMatch = $derived(newPassword === confirmPassword);
	let passwordStrength = $derived(calculateStrength(newPassword));

	// Delete Dialog State
	let showDeleteDialog = $state(false);

	function calculateStrength(pwd: string) {
		if (!pwd) return 0;
		let strength = 0;
		if (pwd.length >= 8) strength += 25;
		if (/[A-Z]/.test(pwd)) strength += 25;
		if (/[0-9]/.test(pwd)) strength += 25;
		if (/[^A-Za-z0-9]/.test(pwd)) strength += 25;
		return strength;
	}

	function getStrengthColor(strength: number) {
		if (strength <= 25) return 'bg-red-500';
		if (strength <= 50) return 'bg-orange-500';
		if (strength <= 75) return 'bg-yellow-500';
		return 'bg-emerald-500';
	}

	function getStrengthText(strength: number) {
		if (strength === 0) return '';
		if (strength <= 25) return 'Weak';
		if (strength <= 50) return 'Fair';
		if (strength <= 75) return 'Good';
		return 'Strong';
	}
</script>

<div class="max-w-xl space-y-8">
	<form
		method="POST"
		action="?/updatePassword"
		use:enhance={() => {
			loading = true;
			return async ({ update, result }) => {
				await update();
				loading = false;
				if (result.type === 'success') {
					toast.success('Password updated successfully');
					currentPassword = '';
					newPassword = '';
					confirmPassword = '';
					showCurrentPassword = false;
					showNewPassword = false;
					showConfirmPassword = false;
				} else if (result.type === 'failure') {
					const msg = result.data?.message;
					toast.error(typeof msg === 'string' ? msg : 'Failed to update password');
				}
			};
		}}
		class="space-y-6"
	>
		<h3 class="text-lg font-medium text-foreground">Change Password</h3>

		<div class="space-y-2">
			<label for="currentPassword" class="text-sm font-medium text-muted-foreground"
				>Current Password</label
			>
			<div class="relative">
				<input
					type={showCurrentPassword ? 'text' : 'password'}
					id="currentPassword"
					name="currentPassword"
					required
					bind:value={currentPassword}
					class="w-full rounded-xl border border-input bg-background px-4 py-3 pr-12 text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-hidden"
				/>
				<button
					type="button"
					class="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
					onclick={() => (showCurrentPassword = !showCurrentPassword)}
				>
					{#if showCurrentPassword}
						<IconEyeOff class="h-5 w-5" />
					{:else}
						<IconEye class="h-5 w-5" />
					{/if}
				</button>
			</div>
		</div>

		<div class="grid gap-6 md:grid-cols-2">
			<div class="space-y-2">
				<label for="newPassword" class="text-sm font-medium text-muted-foreground"
					>New Password</label
				>
				<div class="relative">
					<input
						type={showNewPassword ? 'text' : 'password'}
						id="newPassword"
						name="newPassword"
						required
						minlength="6"
						bind:value={newPassword}
						class="w-full rounded-xl border border-input bg-background px-4 py-3 pr-12 text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-hidden"
					/>
					<button
						type="button"
						class="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
						onclick={() => (showNewPassword = !showNewPassword)}
					>
						{#if showNewPassword}
							<IconEyeOff class="h-5 w-5" />
						{:else}
							<IconEye class="h-5 w-5" />
						{/if}
					</button>
				</div>

				{#if newPassword}
					<div class="mt-2 space-y-1">
						<div
							class="flex items-center justify-between text-[10px] font-bold tracking-wider text-muted-foreground uppercase"
						>
							<span>Strength</span>
							<span>{getStrengthText(passwordStrength)}</span>
						</div>
						<div class="h-1 w-full overflow-hidden rounded-full bg-muted">
							<div
								class="h-full transition-all duration-500 {getStrengthColor(passwordStrength)}"
								style="width: {passwordStrength}%"
							></div>
						</div>
					</div>
				{/if}
			</div>

			<div class="space-y-2">
				<label for="confirmPassword" class="text-sm font-medium text-muted-foreground"
					>Confirm Password</label
				>
				<div class="relative">
					<input
						type={showConfirmPassword ? 'text' : 'password'}
						id="confirmPassword"
						name="confirmPassword"
						required
						minlength="6"
						bind:value={confirmPassword}
						class="w-full rounded-xl border {confirmPassword && !passwordMatch
							? 'border-destructive'
							: 'border-input'} bg-background px-4 py-3 pr-12 text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-hidden"
					/>
					<button
						type="button"
						class="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
						onclick={() => (showConfirmPassword = !showConfirmPassword)}
					>
						{#if showConfirmPassword}
							<IconEyeOff class="h-5 w-5" />
						{:else}
							<IconEye class="h-5 w-5" />
						{/if}
					</button>
				</div>
				{#if confirmPassword && !passwordMatch}
					<p class="text-xs text-destructive">Passwords do not match</p>
				{:else if confirmPassword && passwordMatch}
					<p class="text-xs text-emerald-500">Passwords match</p>
				{/if}
			</div>
		</div>

		<button
			type="submit"
			disabled={loading || (newPassword !== '' && !passwordMatch)}
			class="inline-flex items-center gap-2 rounded-xl bg-secondary px-6 py-3 font-semibold text-secondary-foreground transition-all hover:bg-secondary/80 disabled:opacity-50"
		>
			{#if loading}
				<IconLoader class="h-5 w-5 animate-spin" />
				Updating...
			{:else}
				<IconLock class="h-4 w-4" />
				Update Password
			{/if}
		</button>
	</form>

	<div class="h-px bg-border"></div>

	<!-- Delete Account Trigger -->
	<div class="space-y-4 rounded-xl border border-destructive/20 bg-destructive/5 p-6">
		<div class="flex items-center gap-3">
			<div class="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
				<IconTrash class="h-5 w-5 text-destructive" />
			</div>
			<div>
				<h3 class="text-lg font-medium text-destructive">Danger Zone</h3>
				<p class="text-sm text-muted-foreground">
					Permanently delete your account and all of your content.
				</p>
			</div>
		</div>
		<p class="text-sm text-muted-foreground">
			This action is irreversible. All your data, including history and settings, will be
			permanently removed.
		</p>
		<button
			type="button"
			onclick={() => (showDeleteDialog = true)}
			class="inline-flex items-center gap-2 rounded-xl bg-destructive/10 px-6 py-3 font-semibold text-destructive transition-all hover:bg-destructive/20"
		>
			<IconTrash class="h-4 w-4" />
			Delete Account
		</button>
	</div>

	<DeleteAccountDialog bind:open={showDeleteDialog} />
</div>
