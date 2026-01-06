<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	import { IconError } from '$lib/components/icons';
	import { Mail, Lock, LogIn } from '@lucide/svelte';

	let { form }: PageProps = $props();

	let loading = $state(false);
</script>

<div
	class="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 p-6"
>
	<div
		class="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl"
	>
		<!-- Header -->
		<div class="mb-8 text-center">
			<div
				class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-violet-500 to-purple-600 shadow-lg"
			>
				<span class="text-xl font-bold text-white">IS</span>
			</div>
			<h1 class="text-2xl font-bold text-white">Welcome Back</h1>
			<p class="mt-2 text-slate-400">Sign in to your account</p>
		</div>

		<!-- Error Message -->
		{#if form?.message}
			<div
				class="mb-6 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4"
			>
				<IconError class="h-5 w-5 text-red-400" />
				<p class="text-sm text-red-300">{form.message}</p>
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
				<label for="email" class="block text-sm font-medium text-slate-300">Email</label>
				<div class="relative">
					<Mail class="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-500" />
					<input
						type="email"
						name="email"
						id="email"
						required
						value={form?.email ?? ''}
						class="w-full rounded-xl border border-white/10 bg-white/5 py-3 pr-4 pl-12 text-white placeholder-slate-500 transition-all focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/50 focus:outline-none"
						placeholder="you@example.com"
					/>
				</div>
			</div>

			<div class="space-y-2">
				<label for="password" class="block text-sm font-medium text-slate-300">Password</label>
				<div class="relative">
					<Lock class="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-500" />
					<input
						type="password"
						name="password"
						id="password"
						required
						class="w-full rounded-xl border border-white/10 bg-white/5 py-3 pr-4 pl-12 text-white placeholder-slate-500 transition-all focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/50 focus:outline-none"
						placeholder="••••••••"
					/>
				</div>
			</div>

			<button
				type="submit"
				disabled={loading}
				class="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-violet-600 to-purple-600 px-6 py-4 font-semibold text-white shadow-lg shadow-purple-500/30 transition-all duration-300 hover:from-violet-500 hover:to-purple-500 hover:shadow-purple-500/50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
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

		<!-- Footer -->
		<p class="mt-6 text-center text-sm text-slate-400">
			Don't have an account?
			<a href="/register" class="font-medium text-violet-400 hover:text-violet-300">Sign up</a>
		</p>
	</div>
</div>
