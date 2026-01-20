<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Select from '$lib/components/ui/select';
	import { Badge } from '$lib/components/ui/badge';
	import { toast } from 'svelte-sonner';
	import {
		Megaphone,
		Plus,
		Trash2,
		Edit,
		Clock,
		Info,
		AlertTriangle,
		CheckCircle2,
		Eye,
		EyeOff
	} from '@lucide/svelte';

	let { data } = $props();
	let announcements = $derived(data.announcements);

	let isUpsertOpen = $state(false);
	let editingAnnouncement = $state<any>(null);

	function openCreate() {
		editingAnnouncement = {
			title: '',
			content: '',
			type: 'info',
			target: 'all',
			isActive: true,
			expiresAt: ''
		};
		isUpsertOpen = true;
	}

	function openEdit(a: any) {
		editingAnnouncement = {
			...a,
			expiresAt: a.expiresAt ? new Date(a.expiresAt).toISOString().split('T')[0] : ''
		};
		isUpsertOpen = true;
	}

	const types = [
		{ value: 'info', label: 'Information', icon: Info, color: 'text-blue-500' },
		{ value: 'warning', label: 'Warning', icon: AlertTriangle, color: 'text-amber-500' },
		{ value: 'success', label: 'Success', icon: CheckCircle2, color: 'text-green-500' }
	];

	const targets = [
		{ value: 'all', label: 'All Users' },
		{ value: 'free', label: 'Free Tier' },
		{ value: 'pro', label: 'Pro & Business' }
	];
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-3xl font-bold tracking-tight">Announcements</h2>
			<p class="text-sm text-muted-foreground">Send global broadcasts to your users</p>
		</div>
		<Button onclick={openCreate} class="gap-2">
			<Plus class="size-4" /> Create New
		</Button>
	</div>

	<div class="grid gap-4">
		{#if announcements.length === 0}
			<div
				class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed bg-muted/30 p-12"
			>
				<Megaphone class="mb-4 size-12 text-muted-foreground/50" />
				<p class="text-lg font-medium">No announcements yet</p>
				<p class="mb-4 text-sm text-muted-foreground">Start broadcasting to your users today.</p>
				<Button variant="outline" onclick={openCreate}>Create First Announcement</Button>
			</div>
		{:else}
			{#each announcements as a}
				<div
					class="group relative flex items-center justify-between rounded-xl border bg-card p-6 shadow-sm transition-all hover:border-primary/50"
				>
					<div class="flex items-start gap-4">
						<div class="mt-1 rounded-lg bg-muted p-2 text-primary">
							{#if a.type === 'warning'}
								<AlertTriangle class="size-5 text-amber-500" />
							{:else if a.type === 'success'}
								<CheckCircle2 class="size-5 text-green-500" />
							{:else}
								<Megaphone class="size-5" />
							{/if}
						</div>
						<div>
							<div class="mb-1 flex items-center gap-2">
								<h3 class="text-lg font-bold">{a.title}</h3>
								{#if a.isActive}
									<Badge class="bg-green-500/10 text-green-600 hover:bg-green-500/20">Active</Badge>
								{:else}
									<Badge variant="secondary">Draft</Badge>
								{/if}
								<Badge variant="outline" class="capitalize">{a.target}</Badge>
							</div>
							<p class="line-clamp-2 text-muted-foreground">{a.content}</p>
							<div class="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
								<span class="flex items-center gap-1">
									<Clock class="size-3" /> Created {new Date(a.createdAt).toLocaleDateString()}
								</span>
								{#if a.expiresAt}
									<span class="flex items-center gap-1">
										<Clock class="size-3" /> Expires {new Date(a.expiresAt).toLocaleDateString()}
									</span>
								{/if}
							</div>
						</div>
					</div>
					<div class="flex items-center gap-2">
						<Button variant="ghost" size="icon" onclick={() => openEdit(a)}>
							<Edit class="size-4" />
						</Button>
						<form
							method="POST"
							action="?/delete"
							use:enhance={({ cancel }) => {
								if (!confirm('Are you sure you want to delete this?')) cancel();
								return async ({ result }) => {
									if (result.type === 'success') toast.success('Deleted');
								};
							}}
						>
							<input type="hidden" name="id" value={a.id} />
							<Button
								type="submit"
								variant="ghost"
								size="icon"
								class="text-destructive hover:bg-destructive/10"
							>
								<Trash2 class="size-4" />
							</Button>
						</form>
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>

<Dialog.Root bind:open={isUpsertOpen}>
	<Dialog.Content class="sm:max-w-150">
		<Dialog.Header>
			<Dialog.Title>{editingAnnouncement?.id ? 'Edit' : 'Create'} Announcement</Dialog.Title>
			<Dialog.Description>Manage the message displayed to your users.</Dialog.Description>
		</Dialog.Header>

		{#if editingAnnouncement}
			<form
				method="POST"
				action="?/upsert"
				class="space-y-4 pt-4"
				use:enhance={() => {
					isUpsertOpen = false;
					return async ({ result }) => {
						if (result.type === 'success') toast.success('Saved successfully');
						else toast.error('Failed to save');
					};
				}}
			>
				<input type="hidden" name="id" value={editingAnnouncement.id} />
				<input type="hidden" name="isActive" value={editingAnnouncement.isActive} />
				<input type="hidden" name="type" value={editingAnnouncement.type} />
				<input type="hidden" name="target" value={editingAnnouncement.target} />

				<div class="space-y-2">
					<Label for="title">Title</Label>
					<Input
						id="title"
						name="title"
						bind:value={editingAnnouncement.title}
						placeholder="Maintenance Update"
						required
					/>
				</div>

				<div class="space-y-2">
					<Label for="content">Content</Label>
					<Textarea
						id="content"
						name="content"
						bind:value={editingAnnouncement.content}
						placeholder="Enter your broadcast message here..."
						required
						rows={4}
					/>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-2">
						<Label>Type</Label>
						<Select.Root type="single" bind:value={editingAnnouncement.type}>
							<Select.Trigger class="w-full">
								<div class="flex items-center gap-2">
									{#if editingAnnouncement.type === 'info'}<Info class="size-4 text-blue-500" />
									{:else if editingAnnouncement.type === 'warning'}<AlertTriangle
											class="size-4 text-amber-500"
										/>
									{:else if editingAnnouncement.type === 'success'}<CheckCircle2
											class="size-4 text-green-500"
										/>{/if}
									{types.find((t) => t.value === editingAnnouncement.type)?.label}
								</div>
							</Select.Trigger>
							<Select.Content>
								{#each types as t}
									<Select.Item value={t.value}>
										<div class="flex items-center gap-2">
											<t.icon class="size-4 {t.color}" />
											{t.label}
										</div>
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					<div class="space-y-2">
						<Label>Target Users</Label>
						<Select.Root type="single" bind:value={editingAnnouncement.target}>
							<Select.Trigger class="w-full">
								{targets.find((t) => t.value === editingAnnouncement.target)?.label}
							</Select.Trigger>
							<Select.Content>
								{#each targets as t}
									<Select.Item value={t.value}>{t.label}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-2">
						<Label for="expiresAt">Expires At (Optional)</Label>
						<Input
							type="date"
							id="expiresAt"
							name="expiresAt"
							bind:value={editingAnnouncement.expiresAt}
						/>
					</div>
					<div class="flex flex-col justify-end">
						<Button
							type="button"
							variant="outline"
							class="w-full gap-2 {editingAnnouncement.isActive
								? 'text-green-600'
								: 'text-muted-foreground'}"
							onclick={() => (editingAnnouncement.isActive = !editingAnnouncement.isActive)}
						>
							{#if editingAnnouncement.isActive}
								<Eye class="size-4" /> Active
							{:else}
								<EyeOff class="size-4" /> Hidden
							{/if}
						</Button>
					</div>
				</div>

				<Dialog.Footer class="pt-4">
					<Button type="submit" class="w-full sm:w-auto">Save Announcement</Button>
				</Dialog.Footer>
			</form>
		{/if}
	</Dialog.Content>
</Dialog.Root>
