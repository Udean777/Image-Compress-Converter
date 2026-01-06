<script lang="ts">
	import { IconStar, IconLogout } from '$lib/components/icons';

	interface Props {
		email: string;
		credits: number;
	}

	let { email, credits }: Props = $props();

	let userInitial = $derived(email.charAt(0).toUpperCase());
</script>

<div
	class="flex items-center gap-4 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 shadow-lg backdrop-blur-xl"
>
	<div
		class="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-violet-500 to-purple-600 text-sm font-semibold text-white"
	>
		{userInitial}
	</div>
	<div>
		<p class="max-w-45 truncate text-sm font-medium text-white/90">{email}</p>
		<div class="flex items-center gap-1.5">
			<IconStar class="h-4 w-4 text-amber-400" />
			<span class="text-sm font-semibold text-amber-400">{credits} Credits</span>
		</div>
	</div>

	<!-- Logout Button -->
	<form method="POST" action="?/logout">
		<button
			type="submit"
			class="ml-2 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-all duration-200 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
			title="Logout"
		>
			<IconLogout size={16} />
		</button>
	</form>
</div>
