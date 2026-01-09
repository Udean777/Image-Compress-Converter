<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import type { PageProps } from './$types';
	import ModeToggle from '$lib/components/mode-toggle.svelte';
	import PricingSection from '$lib/components/PricingSection.svelte';

	let { data }: PageProps = $props();
	const user = $derived(data.user);
	const plans = $derived(data.plans || []);
</script>

<div class="min-h-screen bg-background">
	<nav class="container mx-auto px-6 py-4">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6 text-primary-foreground"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
						<circle cx="8.5" cy="8.5" r="1.5" />
						<polyline points="21 15 16 10 5 21" />
					</svg>
				</div>
				<span class="text-xl font-bold text-foreground">Image Studio</span>
			</div>
			<div class="flex items-center gap-4">
				<ModeToggle />
				{#if user}
					<Button
						href="/dashboard"
						class="border-0 bg-primary text-primary-foreground hover:bg-primary/90"
					>
						Dashboard
					</Button>
				{:else}
					<a href="/login" class="text-muted-foreground transition-colors hover:text-foreground"
						>Login</a
					>
					<Button
						href="/register"
						class="border-0 bg-primary text-primary-foreground hover:bg-primary/90"
					>
						Get Started
					</Button>
				{/if}
			</div>
		</div>
	</nav>

	<section class="container mx-auto px-6 py-24 text-center">
		<div class="mx-auto max-w-4xl">
			<div
				class="mb-8 inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm text-muted-foreground backdrop-blur-sm"
			>
				<span class="h-2 w-2 animate-pulse rounded-full bg-green-400"></span>
				Trusted by 10,000+ users
			</div>

			<h1 class="mb-6 text-5xl leading-tight font-bold text-foreground md:text-7xl">
				Compress & Convert
				<span
					class="bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent dark:from-purple-400 dark:to-pink-400"
				>
					Images Instantly
				</span>
			</h1>

			<p class="mx-auto mb-12 max-w-2xl text-xl text-muted-foreground">
				Powerful image optimization tool that reduces file sizes by up to 90% without losing
				quality. Convert between formats seamlessly.
			</p>

			<div class="flex flex-col justify-center gap-4 sm:flex-row">
				{#if user}
					<Button
						href="/dashboard"
						size="lg"
						class="border-0 bg-primary px-8 py-6 text-lg text-primary-foreground hover:bg-primary/90"
					>
						Go to Dashboard
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="ml-2 h-5 w-5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<line x1="5" y1="12" x2="19" y2="12" />
							<polyline points="12 5 19 12 12 19" />
						</svg>
					</Button>
				{:else}
					<Button
						href="/login"
						size="lg"
						class="border-0 bg-primary px-8 py-6 text-lg text-primary-foreground hover:bg-primary/90"
					>
						Start Free Trial
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="ml-2 h-5 w-5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<line x1="5" y1="12" x2="19" y2="12" />
							<polyline points="12 5 19 12 12 19" />
						</svg>
					</Button>
				{/if}
				<Button
					href="#features"
					variant="outline"
					size="lg"
					class="border-input px-8 py-6 text-lg text-foreground hover:bg-accent hover:text-accent-foreground"
				>
					Learn More
				</Button>
			</div>
		</div>
	</section>

	<section id="features" class="container mx-auto px-6 py-24">
		<div class="mb-16 text-center">
			<h2 class="mb-4 text-4xl font-bold text-foreground">Why Choose Image Studio?</h2>
			<p class="mx-auto max-w-2xl text-muted-foreground">
				Everything you need to optimize your images for the web
			</p>
		</div>

		<div class="grid gap-8 md:grid-cols-3">
			<div
				class="group rounded-2xl border border-border bg-card p-8 shadow-sm transition-all hover:border-primary/50"
			>
				<div
					class="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 transition-transform group-hover:scale-110"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-7 w-7 text-primary"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<polyline points="23 4 23 10 17 10" />
						<path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
					</svg>
				</div>
				<h3 class="mb-3 text-xl font-semibold text-foreground">Lightning Fast</h3>
				<p class="text-muted-foreground">
					Compress images in seconds with our optimized algorithms. No waiting, instant results.
				</p>
			</div>

			<div
				class="group rounded-2xl border border-border bg-card p-8 shadow-sm transition-all hover:border-primary/50"
			>
				<div
					class="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 transition-transform group-hover:scale-110"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-7 w-7 text-primary"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
					</svg>
				</div>
				<h3 class="mb-3 text-xl font-semibold text-foreground">Secure & Private</h3>
				<p class="text-muted-foreground">
					Your images are processed securely and automatically deleted after processing.
				</p>
			</div>

			<div
				class="group rounded-2xl border border-border bg-card p-8 shadow-sm transition-all hover:border-primary/50"
			>
				<div
					class="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 transition-transform group-hover:scale-110"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-7 w-7 text-primary"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
						<line x1="3" y1="9" x2="21" y2="9" />
						<line x1="9" y1="21" x2="9" y2="9" />
					</svg>
				</div>
				<h3 class="mb-3 text-xl font-semibold text-foreground">Multiple Formats</h3>
				<p class="text-muted-foreground">
					Convert between PNG, JPG, WEBP, AVIF and more. One tool for all your needs.
				</p>
			</div>
		</div>
	</section>

	<PricingSection {plans} />

	<section class="container mx-auto px-6 py-24">
		<div class="relative overflow-hidden rounded-3xl bg-primary p-12 text-center md:p-16">
			<div class="relative">
				<h2 class="mb-6 text-4xl font-bold text-primary-foreground md:text-5xl">
					Ready to optimize your images?
				</h2>
				<p class="mx-auto mb-8 max-w-2xl text-xl text-primary-foreground/80">
					Join thousands of users who trust Image Studio for their image optimization needs.
				</p>
				{#if user}
					<Button
						href="/dashboard"
						size="lg"
						class="bg-background px-8 py-6 text-lg font-semibold text-foreground hover:bg-muted"
					>
						Go to Dashboard
					</Button>
				{:else}
					<Button
						href="/login"
						size="lg"
						class="bg-background px-8 py-6 text-lg font-semibold text-foreground hover:bg-muted"
					>
						Get Started for Free
					</Button>
				{/if}
			</div>
		</div>
	</section>

	<footer class="border-t border-border">
		<div class="container mx-auto px-6 py-8">
			<div class="flex flex-col items-center justify-between gap-4 md:flex-row">
				<div class="flex items-center gap-2">
					<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4 text-primary-foreground"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
							<circle cx="8.5" cy="8.5" r="1.5" />
							<polyline points="21 15 16 10 5 21" />
						</svg>
					</div>
					<span class="font-semibold text-foreground">Image Studio</span>
				</div>
				<p class="text-sm text-muted-foreground">© 2026 Image Studio. All rights reserved.</p>
			</div>
		</div>
	</footer>
</div>
