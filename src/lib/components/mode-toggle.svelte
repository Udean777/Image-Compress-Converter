<script module>
	const toggleMode = () => {
		const current = localStorage.getItem('mode-watcher-mode');
		if (current === 'dark') {
			setMode('light');
		} else {
			setMode('dark');
		}
	};
</script>

<script lang="ts">
	import { setMode } from 'mode-watcher';
	import { Button } from '$lib/components/ui/button';
	import { Sun, Moon } from '@lucide/svelte';
</script>

<Button variant="outline" size="icon" onclick={toggleMode}>
	<span
		class="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90"
	>
		<Sun />
	</span>
	<span
		class="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
	>
		<Moon />
	</span>
</Button>
