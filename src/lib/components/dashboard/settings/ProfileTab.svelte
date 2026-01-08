<script lang="ts">
	import { IconUpload, IconLoader } from '$lib/components/icons';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import AvatarEditorDialog from './AvatarEditorDialog.svelte';

	let { user }: { user: any } = $props();

	let loading = $state(false);
	let showEditor = $state(false);
	let avatarImage = $state<string | null>(null);
	let fileInput = $state<HTMLInputElement>();

	// Add cache buster to avatar URL
	let avatarUrl = $derived(user.avatarUrl ? `${user.avatarUrl}?t=${Date.now()}` : null);

	function onFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files && input.files[0]) {
			const reader = new FileReader();
			reader.onload = () => {
				avatarImage = reader.result as string;
				showEditor = true;
			};
			reader.readAsDataURL(input.files[0]);
		}
		// Reset input value so same file can be selected again
		input.value = '';
	}
</script>

<div class="max-w-xl space-y-8">
	<!-- Avatar Upload -->
	<div class="flex items-center gap-6">
		<div class="relative h-20 w-20 shrink-0">
			{#if avatarUrl}
				<img
					src={avatarUrl}
					alt="Avatar"
					class="h-full w-full rounded-full object-cover ring-4 ring-background"
				/>
			{:else}
				<div
					class="flex h-full w-full items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground ring-4 ring-background"
				>
					{(user.name || user.email).charAt(0).toUpperCase()}
				</div>
			{/if}

			<label
				class="absolute -right-1 -bottom-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-secondary text-secondary-foreground ring-2 ring-background transition-colors hover:bg-secondary/80"
			>
				<IconUpload class="h-4 w-4" />
				<input
					bind:this={fileInput}
					type="file"
					accept="image/*"
					class="hidden"
					onchange={onFileChange}
				/>
			</label>
		</div>
		<div>
			<h3 class="text-lg font-medium text-foreground">Profile Photo</h3>
			<p class="text-sm text-muted-foreground">Click the icon to upload a new specific photo.</p>
		</div>
	</div>

	<div class="h-px bg-border"></div>

	<!-- Profile Form -->
	<form
		method="POST"
		action="?/updateProfile"
		use:enhance={() => {
			loading = true;
			return async ({ update, result }) => {
				await update();
				loading = false;
				if (result.type === 'success') {
					toast.success('Profile updated successfully');
				} else if (result.type === 'failure') {
					const msg = result.data?.message;
					toast.error(typeof msg === 'string' ? msg : 'Failed to update profile');
				}
			};
		}}
		class="space-y-6"
	>
		<div class="space-y-2">
			<label for="email" class="text-sm font-medium text-muted-foreground">Email</label>
			<input
				type="email"
				id="email"
				value={user.email}
				disabled
				class="w-full rounded-xl border border-input bg-muted/50 px-4 py-3 text-muted-foreground focus:outline-hidden"
			/>
			<p class="text-xs text-muted-foreground">Email cannot be changed</p>
		</div>

		<div class="space-y-2">
			<label for="name" class="text-sm font-medium text-muted-foreground">Display Name</label>
			<input
				type="text"
				id="name"
				name="name"
				value={user.name || ''}
				placeholder="Enter your name"
				class="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-hidden"
			/>
		</div>

		<button
			type="submit"
			disabled={loading}
			class="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 disabled:opacity-50"
		>
			{#if loading}
				<IconLoader class="h-5 w-5 animate-spin" />
				Saving...
			{:else}
				Save Changes
			{/if}
		</button>
	</form>

	<AvatarEditorDialog bind:open={showEditor} imageSrc={avatarImage} />
</div>
