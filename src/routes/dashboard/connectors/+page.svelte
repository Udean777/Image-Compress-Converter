<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { IconCloud, IconUpload } from '$lib/components/icons';
	import { Database, HardDrive, Trash2, Plus, Info } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	let { data } = $props();

	let showS3Form = $state(false);

	// Helper for type-safe config access
	function getConfig(provider: string) {
		const conn = data.connectors.find((c) => c.provider === provider);
		return (conn?.config as any) || {};
	}

	import { page } from '$app/stores';

	$effect(() => {
		if ($page.url.searchParams.get('connect') === 'success') {
			toast.success('Google Drive connected successfully!');
			// Clean up URL
			const newUrl = new URL($page.url);
			newUrl.searchParams.delete('connect');
			window.history.replaceState({}, '', newUrl);
		}
	});
</script>

<div class="space-y-8">
	<header>
		<h1 class="text-2xl font-bold text-foreground md:text-3xl lg:text-4xl">Cloud Connectors</h1>
		<p class="mt-1 text-muted-foreground">
			Sync your processed images directly to your own cloud storage
		</p>
	</header>

	<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
		<!-- Custom S3 Card -->
		<Card class="relative overflow-hidden">
			<CardHeader>
				<div
					class="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-900/30"
				>
					<Database class="size-6" />
				</div>
				<CardTitle>Custom S3 / MinIO</CardTitle>
				<CardDescription>Compatible with MinIO, AWS S3, DigitalOcean Spaces, etc.</CardDescription>
			</CardHeader>
			<CardContent>
				{#if data.connectors.find((c) => c.provider === 's3')}
					<div class="space-y-4">
						<div class="rounded-lg bg-muted p-3 text-xs">
							<p><strong>Bucket:</strong> {getConfig('s3').bucket || 'N/A'}</p>
							<p><strong>Endpoint:</strong> {getConfig('s3').endpoint || 'N/A'}</p>
						</div>
						<form method="POST" action="?/delete" use:enhance>
							<input type="hidden" name="provider" value="s3" />
							<Button variant="destructive" size="sm" class="w-full gap-2">
								<Trash2 class="size-4" /> Disconnect
							</Button>
						</form>
					</div>
				{:else if showS3Form}
					<form
						method="POST"
						action="?/save_s3"
						class="space-y-4"
						use:enhance={() => {
							return async ({ result }) => {
								if (result.type === 'success') {
									toast.success('S3 Connector saved!');
									showS3Form = false;
								}
							};
						}}
					>
						<div class="space-y-2">
							<Label for="endpoint" class="text-xs">Endpoint URL</Label>
							<Input
								id="endpoint"
								name="endpoint"
								placeholder="https://s3.amazonaws.com"
								class="h-8 text-xs"
								required
							/>
						</div>
						<div class="space-y-2">
							<Label for="region" class="text-xs">Region</Label>
							<Input id="region" name="region" placeholder="us-east-1" class="h-8 text-xs" />
						</div>
						<div class="grid grid-cols-2 gap-2">
							<div class="space-y-2">
								<Label for="accessKey" class="text-xs">Access Key</Label>
								<Input
									id="accessKey"
									name="accessKey"
									type="password"
									class="h-8 text-xs"
									required
								/>
							</div>
							<div class="space-y-2">
								<Label for="secretKey" class="text-xs">Secret Key</Label>
								<Input
									id="secretKey"
									name="secretKey"
									type="password"
									class="h-8 text-xs"
									required
								/>
							</div>
						</div>
						<div class="space-y-2">
							<Label for="bucket" class="text-xs">Bucket Name</Label>
							<Input
								id="bucket"
								name="bucket"
								placeholder="my-images"
								class="h-8 text-xs"
								required
							/>
						</div>
						<div class="flex gap-2">
							<Button type="submit" size="sm" class="flex-1">Save S3</Button>
							<Button variant="ghost" size="sm" onclick={() => (showS3Form = false)}>Cancel</Button>
						</div>
					</form>
				{:else}
					<Button variant="outline" class="w-full gap-2" onclick={() => (showS3Form = true)}>
						<Plus class="size-4" /> Configure S3
					</Button>
				{/if}
			</CardContent>
		</Card>

		<!-- Google Drive Card -->
		<Card class="relative">
			<CardHeader>
				<div
					class="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30"
				>
					<IconCloud class="size-6" />
				</div>
				<CardTitle>Google Drive</CardTitle>
				<CardDescription>Direct upload to your G-Drive folders.</CardDescription>
			</CardHeader>
			<CardContent>
				{#if data.connectors.find((c) => c.provider === 'google_drive')}
					<div class="space-y-4">
						<div class="flex items-center gap-2 rounded-lg bg-green-500/10 p-3 text-xs text-green-600">
							<div class="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
							<span>Connected to Google Drive</span>
						</div>
						<form method="POST" action="?/delete" use:enhance>
							<input type="hidden" name="provider" value="google_drive" />
							<Button variant="destructive" size="sm" class="w-full gap-2">
								<Trash2 class="size-4" /> Disconnect
							</Button>
						</form>
					</div>
				{:else}
					<div class="space-y-4">
						<p class="text-xs text-muted-foreground">
							Connect to upload images to an "Image Studio" folder in your Drive.
						</p>
						<Button variant="outline" class="w-full gap-2" href="/api/auth/google/login">
							<Plus class="size-4" /> Connect Google Drive
						</Button>
					</div>
				{/if}
			</CardContent>
		</Card>

		<!-- Dropbox Card (Coming Soon) -->
		<Card class="relative opacity-70 grayscale-[0.5]">
			<CardHeader>
				<div
					class="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-500 dark:bg-blue-900/20"
				>
					<HardDrive class="size-6" />
				</div>
				<CardTitle>Dropbox</CardTitle>
				<CardDescription>Direct upload to your Dropbox account.</CardDescription>
			</CardHeader>
			<CardContent>
				<div
					class="flex items-center gap-2 rounded-lg bg-blue-500/10 p-2 text-[10px] text-blue-600 dark:text-blue-400"
				>
					<Info class="size-3" /> Coming Soon
				</div>
			</CardContent>
		</Card>
	</div>
</div>
