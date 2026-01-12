<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import { toast } from 'svelte-sonner';

	let { data } = $props();
	let grantUserId = $state<string | null>(null);
</script>

<div class="flex items-center justify-between">
	<h1 class="text-3xl font-bold tracking-tight">User Management</h1>
</div>

<div class="mt-6 rounded-xl border bg-card shadow-sm">
	<div class="p-0">
		<table class="w-full text-left text-sm">
			<thead class="bg-muted/40">
				<tr>
					<th class="p-4 font-medium text-muted-foreground">User Identity</th>
					<th class="p-4 font-medium text-muted-foreground">Credits</th>
					<th class="p-4 font-medium text-muted-foreground">Status / Role</th>
					<th class="p-4 text-right font-medium text-muted-foreground">Actions</th>
				</tr>
			</thead>
			<tbody class="divide-y">
				{#each data.users as user}
					<tr class="transition-colors hover:bg-muted/5">
						<td class="p-4">
							<div class="font-medium text-foreground">{user.name || 'Anonymous'}</div>
							<div class="text-xs text-muted-foreground">{user.email}</div>
						</td>
						<td class="p-4">
							<div class="font-mono text-lg font-semibold">{user.credits}</div>
							<div class="text-xs text-muted-foreground">Lifetime: {user._count.histories} img</div>
						</td>
						<td class="p-4">
							<div class="flex gap-2">
								<Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>{user.role}</Badge>
								{#if user.isBanned}
									<Badge variant="destructive">BANNED</Badge>
								{:else}
									<Badge variant="outline" class="border-emerald-200 bg-emerald-50 text-emerald-600"
										>Active</Badge
									>
								{/if}
							</div>
						</td>
						<td class="p-4 text-right">
							<div class="flex items-center justify-end gap-2">
								<!-- Grant Credits Form -->
								{#if grantUserId === user.id}
									<form
										method="POST"
										action="?/grantCredits"
										use:enhance={() => {
											return async ({ update }) => {
												await update();
												grantUserId = null;
												toast.success('Credits granted successfully');
											};
										}}
										class="flex animate-in items-center gap-2 fade-in slide-in-from-right-2"
									>
										<input type="hidden" name="userId" value={user.id} />
										<Input
											type="number"
											name="amount"
											class="h-8 w-20"
											placeholder="Qty"
											min="1"
											required
										/>
										<Button size="sm" type="submit">Add</Button>
										<Button size="sm" variant="ghost" onclick={() => (grantUserId = null)}
											>Cancel</Button
										>
									</form>
								{:else}
									<Button size="sm" variant="outline" onclick={() => (grantUserId = user.id)}
										>+ Give Credits</Button
									>
								{/if}

								<!-- Ban Toggle Form -->
								<form method="POST" action="?/toggleBan" use:enhance>
									<input type="hidden" name="userId" value={user.id} />
									<input type="hidden" name="currentStatus" value={user.isBanned.toString()} />
									{#if !user.isBanned}
										<Button size="sm" variant="destructive">Ban User</Button>
									{:else}
										<Button size="sm" variant="secondary">Unban</Button>
									{/if}
								</form>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
