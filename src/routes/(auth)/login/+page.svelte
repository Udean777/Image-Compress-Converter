<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	import { IconError } from '$lib/components/icons';
	import { Mail, Lock, LogIn } from '@lucide/svelte';

	let { form }: PageProps = $props();

	let loading = $state(false);
</script>

<div class="flex min-h-screen items-center justify-center bg-background p-6">
	<div class="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-2xl">
		<div class="mb-8 text-center">
			<div
				class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg"
			>
				<span class="text-xl font-bold text-primary-foreground">IS</span>
			</div>
			<h1 class="text-2xl font-bold text-foreground">Welcome Back</h1>
			<p class="mt-2 text-muted-foreground">Sign in to your account</p>
		</div>

		{#if form?.message}
			<div
				class="mb-6 flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4"
			>
				<IconError class="h-5 w-5 text-destructive" />
				<p class="text-sm text-destructive">{form.message}</p>
			</div>
		{/if}

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
						class="w-full rounded-xl border border-input bg-background py-3 pr-4 pl-12 text-foreground placeholder-muted-foreground transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/50 focus:outline-none"
						placeholder="••••••••"
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
					Signing in...
				{:else}
					<LogIn class="h-5 w-5" />
					Sign In
				{/if}
			</button>
		</form>

		<p class="mt-6 text-center text-sm text-muted-foreground">
			Don't have an account?
			<a href="/register" class="font-medium text-primary hover:text-primary/80">Sign up</a>
		</p>
	</div>
</div>
