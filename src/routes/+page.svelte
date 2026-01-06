<script lang="ts">
	import { Button } from '$lib/components/ui/button';
</script>

<div class="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900">
	<!-- Navigation -->
	<nav class="container mx-auto px-6 py-4">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-r from-purple-500 to-pink-500"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6 text-white"
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
				<span class="text-xl font-bold text-white">Image Studio</span>
			</div>
			<div class="flex items-center gap-4">
				<a href="/login" class="text-gray-300 transition-colors hover:text-white">Login</a>
				<Button
					href="/login"
					class="border-0 bg-linear-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
				>
					Get Started
				</Button>
			</div>
		</div>
	</nav>

	<!-- Hero Section -->
	<section class="container mx-auto px-6 py-24 text-center">
		<div class="mx-auto max-w-4xl">
			<div
				class="mb-8 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-purple-300 backdrop-blur-sm"
			>
				<span class="h-2 w-2 animate-pulse rounded-full bg-green-400"></span>
				Trusted by 10,000+ users
			</div>

			<h1 class="mb-6 text-5xl leading-tight font-bold text-white md:text-7xl">
				Compress & Convert
				<span class="bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
					Images Instantly
				</span>
			</h1>

			<p class="mx-auto mb-12 max-w-2xl text-xl text-gray-300">
				Powerful image optimization tool that reduces file sizes by up to 90% without losing
				quality. Convert between formats seamlessly.
			</p>

			<div class="flex flex-col justify-center gap-4 sm:flex-row">
				<Button
					href="/login"
					size="lg"
					class="border-0 bg-linear-to-r from-purple-500 to-pink-500 px-8 py-6 text-lg text-white hover:from-purple-600 hover:to-pink-600"
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
				<Button
					href="#features"
					variant="outline"
					size="lg"
					class="border-white/20 px-8 py-6 text-lg text-white hover:bg-white/10"
				>
					Learn More
				</Button>
			</div>
		</div>
	</section>

	<!-- Features Section -->
	<section id="features" class="container mx-auto px-6 py-24">
		<div class="mb-16 text-center">
			<h2 class="mb-4 text-4xl font-bold text-white">Why Choose Image Studio?</h2>
			<p class="mx-auto max-w-2xl text-gray-400">
				Everything you need to optimize your images for the web
			</p>
		</div>

		<div class="grid gap-8 md:grid-cols-3">
			<!-- Feature 1 -->
			<div
				class="group rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm transition-all hover:border-purple-500/50"
			>
				<div
					class="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-linear-to-r from-purple-500 to-pink-500 transition-transform group-hover:scale-110"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-7 w-7 text-white"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<polyline points="23 4 23 10 17 10" />
						<path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
					</svg>
				</div>
				<h3 class="mb-3 text-xl font-semibold text-white">Lightning Fast</h3>
				<p class="text-gray-400">
					Compress images in seconds with our optimized algorithms. No waiting, instant results.
				</p>
			</div>

			<!-- Feature 2 -->
			<div
				class="group rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm transition-all hover:border-purple-500/50"
			>
				<div
					class="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-linear-to-r from-purple-500 to-pink-500 transition-transform group-hover:scale-110"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-7 w-7 text-white"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
					</svg>
				</div>
				<h3 class="mb-3 text-xl font-semibold text-white">Secure & Private</h3>
				<p class="text-gray-400">
					Your images are processed securely and automatically deleted after processing.
				</p>
			</div>

			<!-- Feature 3 -->
			<div
				class="group rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm transition-all hover:border-purple-500/50"
			>
				<div
					class="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-linear-to-r from-purple-500 to-pink-500 transition-transform group-hover:scale-110"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-7 w-7 text-white"
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
				<h3 class="mb-3 text-xl font-semibold text-white">Multiple Formats</h3>
				<p class="text-gray-400">
					Convert between PNG, JPG, WEBP, AVIF and more. One tool for all your needs.
				</p>
			</div>
		</div>
	</section>

	<!-- CTA Section -->
	<section class="container mx-auto px-6 py-24">
		<div
			class="relative overflow-hidden rounded-3xl bg-linear-to-r from-purple-600 to-pink-600 p-12 text-center md:p-16"
		>
			<div class="relative">
				<h2 class="mb-6 text-4xl font-bold text-white md:text-5xl">
					Ready to optimize your images?
				</h2>
				<p class="mx-auto mb-8 max-w-2xl text-xl text-white/80">
					Join thousands of users who trust Image Studio for their image optimization needs.
				</p>
				<Button
					href="/login"
					size="lg"
					class="bg-white px-8 py-6 text-lg font-semibold text-purple-600 hover:bg-gray-100"
				>
					Get Started for Free
				</Button>
			</div>
		</div>
	</section>

	<!-- Footer -->
	<footer class="border-t border-white/10">
		<div class="container mx-auto px-6 py-8">
			<div class="flex flex-col items-center justify-between gap-4 md:flex-row">
				<div class="flex items-center gap-2">
					<div
						class="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-r from-purple-500 to-pink-500"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4 text-white"
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
					<span class="font-semibold text-white">Image Studio</span>
				</div>
				<p class="text-sm text-gray-400">© 2026 Image Studio. All rights reserved.</p>
			</div>
		</div>
	</footer>
</div>
