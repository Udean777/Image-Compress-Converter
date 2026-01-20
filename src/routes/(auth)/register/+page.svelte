<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	import { IconError } from '$lib/components/icons';
	import { Mail, Lock, UserPlus } from '@lucide/svelte';

	let { form }: PageProps = $props();

	let loading = $state(false);
	let connectDrive = $state(false);
</script>

<div class="flex min-h-screen items-center justify-center bg-background p-6">
	<div class="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-2xl">
		<!-- Header -->
		<div class="mb-8 text-center">
			<div
				class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg"
			>
				<span class="text-xl font-bold text-primary-foreground">IS</span>
			</div>
			<h1 class="text-2xl font-bold text-foreground">Create Account</h1>
			<p class="mt-2 text-muted-foreground">Get started with 10 free credits</p>
		</div>

		<!-- Error Message -->
		{#if form?.message}
			<div
				class="mb-6 flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4"
			>
				<IconError class="h-5 w-5 text-destructive" />
				<p class="text-sm text-destructive">{form.message}</p>
			</div>
		{/if}

		<!-- Form -->
		<form
			method="POST"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					await update();
					loading = false;
				};
			}}
			class="space-y-5"
		>
			<div class="space-y-2">
				<label for="email" class="block text-sm font-medium text-foreground">Email</label>
				<div class="relative">
					<Mail class="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
					<input
						type="email"
						name="email"
						id="email"
						required
						value={form?.email ?? ''}
						class="w-full rounded-xl border border-input bg-background py-3 pr-4 pl-12 text-foreground placeholder-muted-foreground transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/50 focus:outline-none"
						placeholder="you@example.com"
					/>
				</div>
			</div>

			<div class="space-y-2">
				<label for="password" class="block text-sm font-medium text-foreground">Password</label>
				<div class="relative">
					<Lock class="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
					<input
						type="password"
						name="password"
						id="password"
						required
						minlength="6"
						class="w-full rounded-xl border border-input bg-background py-3 pr-4 pl-12 text-foreground placeholder-muted-foreground transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/50 focus:outline-none"
						placeholder="Minimum 6 characters"
					/>
				</div>
			</div>

			<button
				type="submit"
				disabled={loading}
				class="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all duration-300 hover:bg-primary/90 hover:shadow-primary/50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
			>
				{#if loading}
					<svg class="h-5 w-5 animate-spin" viewBox="0 0 24 24">
						<circle
							class="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							stroke-width="4"
							fill="none"
						/>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						/>
					</svg>
					Creating account...
				{:else}
					<UserPlus class="h-5 w-5" />
					Create Account
				{/if}
			</button>
		</form>

		<div class="mt-6 flex items-center justify-center gap-4">
			<div class="h-px flex-1 bg-border"></div>
			<span class="text-xs text-muted-foreground uppercase tracking-wider">or continue with</span>
			<div class="h-px flex-1 bg-border"></div>
		</div>

		<div class="mt-6 space-y-4">
			<div class="flex items-center justify-center gap-2">
				<input
					type="checkbox"
					id="connectDrive"
					class="accent-primary h-4 w-4 rounded border-gray-300"
					bind:checked={connectDrive}
				/>
				<label for="connectDrive" class="text-sm text-muted-foreground select-none">
					Auto connect Google Drive
				</label>
			</div>

			<a
				href="/api/auth/google{connectDrive ? '?connect_drive=true' : ''}"
				class="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-card px-6 py-3.5 font-medium text-foreground transition-all duration-300 hover:bg-muted active:scale-[0.98]"
			>
				<svg class="h-5 w-5" viewBox="0 0 24 24">
					<path
						d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
						fill="#4285F4"
					/>
					<path
						d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
						fill="#34A853"
					/>
					<path
						d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
						fill="#FBBC05"
					/>
					<path
						d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
						fill="#EA4335"
					/>
				</svg>
				Google
			</a>
		</div>

		<!-- Footer -->
		<p class="mt-6 text-center text-sm text-muted-foreground">
			Already have an account?
			<a href="/login" class="font-medium text-primary hover:text-primary/80">Sign in</a>
		</p>
	</div>
</div>
