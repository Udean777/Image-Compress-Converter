<script lang="ts">
	import type { LayoutProps } from './$types';
	import { IconStar, IconLogout } from '$lib/components/icons';
	import { enhance } from '$app/forms';

	let { data, children }: LayoutProps = $props();
</script>

<div class="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900">
	<!-- Navbar -->
	<nav
		class="sticky top-0 z-50 border-b border-white/10 bg-slate-900/80 px-6 py-4 backdrop-blur-xl"
	>
		<div class="mx-auto flex max-w-6xl items-center justify-between">
			<!-- Logo -->
			<div class="flex items-center gap-3">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-violet-500 to-purple-600 shadow-lg"
				>
					<span class="text-lg font-bold text-white">IS</span>
				</div>
				<h1 class="text-xl font-bold text-white">Image Studio</h1>
			</div>
			<!-- User Info -->
			<div class="flex items-center gap-4">
				<div
					class="flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2"
				>
					<IconStar class="h-4 w-4 text-amber-400" />
					<span class="text-sm font-semibold text-amber-400">{data.user.credits} Credits</span>
				</div>
				<div class="flex items-center gap-3">
					<div
						class="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-violet-500 to-purple-600 text-sm font-semibold text-white"
					>
						{data.user.email.charAt(0).toUpperCase()}
					</div>
					<span class="hidden text-sm text-white/80 md:block">{data.user.email}</span>
				</div>
				<form method="POST" action="?/logout" use:enhance>
					<button
						type="submit"
						class="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-all hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
						title="Logout"
					>
						<IconLogout class="h-4 w-4" />
					</button>
				</form>
			</div>
		</div>
	</nav>
	<!-- Main Content -->
	<main class="p-6 md:p-10">
		<div class="mx-auto max-w-6xl">
			{@render children()}
		</div>
	</main>
</div>
