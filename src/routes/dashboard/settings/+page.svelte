<script lang="ts">
	import type { ActionData, PageProps } from './$types';
	import { enhance } from '$app/forms';
	import {
		IconUser,
		IconLock,
		IconTrash,
		IconLoader,
		IconUpload,
		IconEye,
		IconEyeOff,
		IconError
	} from '$lib/components/icons';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Slider } from '$lib/components/ui/slider';
	import getCroppedImg from '$lib/utils/image';
	import { toast } from 'svelte-sonner';

	let { data, form }: PageProps = $props();
	let activeTab = $state('profile');
	let loading = $state(false);

	// Prefer form data (most recent update) over load data
	let user = $derived(form?.user ?? data.user);
	let currentPassword = $state('');

	// Avatar Editor State
	let showEditor = $state(false);
	let avatarImage = $state<string | null>(null);
	let zoom = $state(1);
	let sliderValue = $state(1);
	let croppedAreaPixels = $state<{ x: number; y: number; width: number; height: number } | null>(
		null
	);
	let fileInput = $state<HTMLInputElement>();

	// Change Password UX State
	let showCurrentPassword = $state(false);
	let showNewPassword = $state(false);
	let showConfirmPassword = $state(false);
	let newPassword = $state('');
	let confirmPassword = $state('');
	let passwordMatch = $derived(newPassword === confirmPassword);
	let passwordStrength = $derived(calculateStrength(newPassword));

	// Delete Account UX State
	let showDeleteDialog = $state(false);
	let deleteStep = $state(1); // 1: Password, 2: Final Warning
	let deletePassword = $state('');
	let showDeletePassword = $state(false);

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

	/* Custom Cropper State */
	let imgElement = $state<HTMLImageElement>();
	let containerElement = $state<HTMLDivElement>();
	let isDragging = $state(false);
	let startPos = $state({ x: 0, y: 0 });
	let imagePos = $state({ x: 0, y: 0 });

	function handleMouseDown(e: MouseEvent | TouchEvent) {
		e.preventDefault();
		isDragging = true;
		const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
		const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
		startPos = { x: clientX - imagePos.x, y: clientY - imagePos.y };
	}

	function handleMouseMove(e: MouseEvent | TouchEvent) {
		if (!isDragging) return;
		e.preventDefault();
		const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
		const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
		imagePos = { x: clientX - startPos.x, y: clientY - startPos.y };
		calculateCrop();
	}

	function handleMouseUp() {
		isDragging = false;
		calculateCrop();
	}

	function calculateCrop() {
		if (!imgElement || !containerElement) return;

		const containerRect = containerElement.getBoundingClientRect();
		const imageRect = imgElement.getBoundingClientRect();

		// Calculate the scale between the rendered image size and the natural size
		const scaleX = imgElement.naturalWidth / imageRect.width;
		const scaleY = imgElement.naturalHeight / imageRect.height;

		// Calculate the top/left visible offset relative to the image
		// visual offset = container.left - image.left
		const visualX = containerRect.left - imageRect.left;
		const visualY = containerRect.top - imageRect.top;

		// Map to natural image coordinates
		const x = Math.max(0, visualX * scaleX);
		const y = Math.max(0, visualY * scaleY);
		const width = containerRect.width * scaleX;
		const height = containerRect.height * scaleY;

		croppedAreaPixels = { x, y, width, height };
	}

	// Recalculate when zoom changes
	$effect(() => {
		if (zoom || imagePos) {
			// Small timeout to allow DOM to update transform
			setTimeout(calculateCrop, 0);
		}
	});

	// Reset when image changes
	$effect(() => {
		if (avatarImage) {
			imagePos = { x: 0, y: 0 };
			zoom = 1;
			setTimeout(calculateCrop, 100);
		}
	});

	async function onSaveCrop() {
		// Force calculation one last time
		calculateCrop();

		if (!avatarImage) {
			console.error('No avatar image present');
			return;
		}

		if (!croppedAreaPixels) {
			console.error('croppedAreaPixels is null. Crop event may not have fired.');
			alert('Please verify the crop area before saving.');
			return;
		}

		try {
			loading = true;
			const croppedImageBlob = await getCroppedImg(avatarImage, croppedAreaPixels);

			if (!croppedImageBlob) {
				throw new Error('Failed to crop image');
			}

			// Create a File object from the Blob
			const file = new File([croppedImageBlob], 'avatar.jpg', { type: 'image/jpeg' });

			// Submit via FormData manually since we're outside a form for the crop
			const formData = new FormData();
			formData.append('avatar', file);

			const response = await fetch('?/updateAvatar', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (result.type === 'success') {
				toast.success('Avatar updated successfully');
				// Refresh page data to show new avatar immediately
				window.location.reload();
			} else {
				// Handle error
				console.error('Upload failed', result);
				toast.error(result?.data?.message || 'Upload failed');
			}
		} catch (e) {
			console.error('Exception in onSaveCrop:', e);
			alert('Error saving crop: ' + (e instanceof Error ? e.message : String(e)));
		} finally {
			loading = false;
			showEditor = false;
			avatarImage = null;
		}
	}
</script>

<div class="space-y-6">
	<header>
		<h1 class="text-3xl font-bold text-white">Settings</h1>
		<p class="mt-1 text-slate-400">Manage your account preferences</p>
	</header>

	<div class="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
		<!-- Tabs -->
		<div class="border-b border-white/10 px-6 pt-4">
			<div class="flex gap-6">
				<button
					class="pb-4 text-sm font-medium transition-colors {activeTab === 'profile'
						? 'border-b-2 border-violet-500 text-violet-400'
						: 'text-slate-400 hover:text-slate-200'}"
					onclick={() => (activeTab = 'profile')}
				>
					Profile
				</button>
				<button
					class="pb-4 text-sm font-medium transition-colors {activeTab === 'security'
						? 'border-b-2 border-violet-500 text-violet-400'
						: 'text-slate-400 hover:text-slate-200'}"
					onclick={() => (activeTab = 'security')}
				>
					Security
				</button>
			</div>
		</div>

		<div class="p-6">
			{#if activeTab === 'profile'}
				<div class="max-w-xl space-y-8">
					<!-- Avatar Upload -->
					<div class="flex items-center gap-6">
						<div class="relative h-20 w-20 shrink-0">
							{#if avatarUrl}
								<img
									src={avatarUrl}
									alt="Avatar"
									class="h-full w-full rounded-full object-cover ring-4 ring-white/10"
								/>
							{:else}
								<div
									class="flex h-full w-full items-center justify-center rounded-full bg-linear-to-br from-violet-500 to-purple-600 text-2xl font-bold text-white ring-4 ring-white/10"
								>
									{(user.name || user.email).charAt(0).toUpperCase()}
								</div>
							{/if}

							<label
								class="absolute -right-1 -bottom-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-slate-800 text-slate-200 ring-2 ring-slate-900 transition-colors hover:bg-slate-700 hover:text-white"
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
							<h3 class="text-lg font-medium text-white">Profile Photo</h3>
							<p class="text-sm text-slate-400">Click the icon to upload a new specific photo.</p>
						</div>
					</div>

					<div class="h-px bg-white/10"></div>

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
							<label for="email" class="text-sm font-medium text-slate-300">Email</label>
							<input
								type="email"
								id="email"
								value={user.email}
								disabled
								class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-slate-400 focus:outline-hidden"
							/>
							<p class="text-xs text-slate-500">Email cannot be changed</p>
						</div>

						<div class="space-y-2">
							<label for="name" class="text-sm font-medium text-slate-300">Display Name</label>
							<input
								type="text"
								id="name"
								name="name"
								value={user.name || ''}
								placeholder="Enter your name"
								class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 focus:outline-hidden"
							/>
						</div>

						<button
							type="submit"
							disabled={loading}
							class="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-violet-600 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:from-violet-500 hover:to-purple-500 disabled:opacity-50"
						>
							{#if loading}
								<IconLoader class="h-5 w-5 animate-spin" />
								Saving...
							{:else}
								Save Changes
							{/if}
						</button>
					</form>
				</div>
			{:else if activeTab === 'security'}
				<div class="max-w-xl space-y-8">
					<!-- Change Password Form -->
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
						<h3 class="text-lg font-medium text-white">Change Password</h3>

						<div class="space-y-2">
							<label for="currentPassword" class="text-sm font-medium text-slate-300"
								>Current Password</label
							>
							<div class="relative">
								<input
									type={showCurrentPassword ? 'text' : 'password'}
									id="currentPassword"
									name="currentPassword"
									required
									bind:value={currentPassword}
									class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-white placeholder-slate-500 focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 focus:outline-hidden"
								/>
								<button
									type="button"
									class="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-200"
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
								<label for="newPassword" class="text-sm font-medium text-slate-300"
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
										class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-white placeholder-slate-500 focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 focus:outline-hidden"
									/>
									<button
										type="button"
										class="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-200"
										onclick={() => (showNewPassword = !showNewPassword)}
									>
										{#if showNewPassword}
											<IconEyeOff class="h-5 w-5" />
										{:else}
											<IconEye class="h-5 w-5" />
										{/if}
									</button>
								</div>
								<!-- Strength Indicator -->
								{#if newPassword}
									<div class="mt-2 space-y-1">
										<div
											class="flex items-center justify-between text-[10px] font-bold tracking-wider text-slate-500 uppercase"
										>
											<span>Strength</span>
											<span>{getStrengthText(passwordStrength)}</span>
										</div>
										<div class="h-1 w-full overflow-hidden rounded-full bg-white/10">
											<div
												class="h-full transition-all duration-500 {getStrengthColor(
													passwordStrength
												)}"
												style="width: {passwordStrength}%"
											></div>
										</div>
									</div>
								{/if}
							</div>

							<div class="space-y-2">
								<label for="confirmPassword" class="text-sm font-medium text-slate-300"
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
											? 'border-red-500/50'
											: 'border-white/10'} bg-white/5 px-4 py-3 pr-12 text-white placeholder-slate-500 focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 focus:outline-hidden"
									/>
									<button
										type="button"
										class="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-200"
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
									<p class="text-xs text-red-400">Passwords do not match</p>
								{:else if confirmPassword && passwordMatch}
									<p class="text-xs text-emerald-400">Passwords match</p>
								{/if}
							</div>
						</div>

						<button
							type="submit"
							disabled={loading || (newPassword !== '' && !passwordMatch)}
							class="inline-flex items-center gap-2 rounded-xl bg-white/10 px-6 py-3 font-semibold text-white transition-all hover:bg-white/20 disabled:opacity-50"
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

					<div class="h-px bg-white/10"></div>

					<!-- Delete Account -->
					<div class="space-y-4 rounded-xl border border-red-500/20 bg-red-500/5 p-6">
						<div class="flex items-center gap-3">
							<div class="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
								<IconTrash class="h-5 w-5 text-red-400" />
							</div>
							<div>
								<h3 class="text-lg font-medium text-red-400">Danger Zone</h3>
								<p class="text-sm text-slate-400">
									Permanently delete your account and all of your content.
								</p>
							</div>
						</div>
						<p class="text-sm text-slate-500">
							This action is irreversible. All your data, including history and settings, will be
							permanently removed.
						</p>
						<button
							type="button"
							onclick={() => {
								showDeleteDialog = true;
								deleteStep = 1;
								deletePassword = '';
							}}
							class="inline-flex items-center gap-2 rounded-xl bg-red-500/10 px-6 py-3 font-semibold text-red-400 transition-all hover:bg-red-500/20"
						>
							<IconTrash class="h-4 w-4" />
							Delete Account
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Avatar Editor Dialog -->
	<Dialog.Root bind:open={showEditor}>
		<Dialog.Content class="border-white/10 bg-slate-900 text-white sm:max-w-125">
			<Dialog.Header>
				<Dialog.Title class="text-xl font-semibold">Edit Avatar</Dialog.Title>
				<Dialog.Description class="text-slate-400">
					Drag to position and zoom to scale.
				</Dialog.Description>
			</Dialog.Header>

			<div
				class="relative mt-4 flex h-64 w-full items-center justify-center overflow-hidden rounded-xl bg-slate-950 select-none"
			>
				{#if avatarImage}
					<!-- Container that acts as the "Crop Frame" -->
					<div
						bind:this={containerElement}
						class="relative z-10 h-48 w-48 overflow-hidden rounded-full shadow-xl ring-4 ring-white/20"
					>
						<!-- Draggable Image -->
						<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
						<img
							bind:this={imgElement}
							src={avatarImage}
							alt="Crop preview"
							class="max-w-none origin-center cursor-move touch-none"
							style="transform: translate({imagePos.x}px, {imagePos.y}px) scale({zoom});"
							onmousedown={handleMouseDown}
							ontouchstart={handleMouseDown}
							onmousemove={handleMouseMove}
							ontouchmove={handleMouseMove}
							onmouseup={handleMouseUp}
							ontouchend={handleMouseUp}
							onmouseleave={handleMouseUp}
							draggable="false"
						/>
					</div>

					<!-- Visual Overlay for context -->
					<div class="pointer-events-none absolute inset-0 z-0 bg-slate-900/50"></div>
				{/if}
			</div>

			<div class="space-y-3 py-4">
				<div class="flex items-center justify-between text-xs text-slate-400">
					<span>Zoom</span>
					<span>{Math.round(zoom * 100)}%</span>
				</div>
				<Slider
					bind:value={sliderValue}
					type="single"
					min={1}
					max={3}
					step={0.1}
					class="w-full"
					onValueChange={(val: number) => {
						zoom = val;
					}}
				/>
			</div>

			<Dialog.Footer>
				<button
					onclick={() => (showEditor = false)}
					class="px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-white"
				>
					Cancel
				</button>
				<button
					onclick={onSaveCrop}
					disabled={loading}
					class="rounded-lg bg-linear-to-r from-violet-600 to-purple-600 px-6 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:from-violet-500 hover:to-purple-500 disabled:opacity-50"
				>
					{#if loading}
						Saving...
					{:else}
						Save Changes
					{/if}
				</button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>

	<!-- Delete Account Dialog -->
	<Dialog.Root bind:open={showDeleteDialog}>
		<Dialog.Content class="border-white/10 bg-slate-900 text-white sm:max-w-md">
			<Dialog.Header>
				<Dialog.Title class="text-xl font-semibold text-red-400">Delete Account</Dialog.Title>
				<Dialog.Description class="text-slate-400">
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
							<label for="deletePassword" class="text-sm font-medium text-slate-300">
								Confirm your password
							</label>
							<div class="relative">
								<input
									type={showDeletePassword ? 'text' : 'password'}
									id="deletePassword"
									name="password"
									bind:value={deletePassword}
									placeholder="Enter your password"
									class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-white placeholder-slate-500 focus:border-red-500/50 focus:ring-4 focus:ring-red-500/10 focus:outline-hidden"
								/>
								<button
									type="button"
									class="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-200"
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
					<div class="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
						<div class="flex gap-3">
							<IconError class="h-5 w-5 shrink-0 text-red-400" />
							<div class="space-y-2">
								<p class="text-sm font-medium text-red-400">Are you absolutely sure?</p>
								<p class="text-xs leading-relaxed text-slate-400">
									Deleting your account will remove all your data from our servers. This includes
									your profile, credits, and all historical records. You will not be able to recover
									them.
								</p>
							</div>
						</div>
					</div>
				{/if}
			</div>

			<Dialog.Footer class="gap-2 sm:gap-0">
				<button
					type="button"
					onclick={() => (showDeleteDialog = false)}
					class="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-white"
				>
					Cancel
				</button>
				{#if deleteStep === 1}
					<button
						onclick={() => (deleteStep = 2)}
						disabled={!deletePassword}
						class="rounded-lg bg-white/10 px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-white/20 disabled:opacity-50"
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
							class="w-full rounded-lg bg-red-600 px-6 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:bg-red-500 disabled:opacity-50"
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
</div>
