<script lang="ts">
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<h1>Register</h1>
{#if form?.message}<p style="color: red">{form.message}</p>{/if}

<form method="POST">
	<label>Email: <input name="email" type="email" required /></label><br />
	<label>Password: <input name="password" type="password" required /></label><br />
	<button>Register</button>
</form>
