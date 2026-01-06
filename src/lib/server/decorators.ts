export function LogExecution(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
	const originalMethod = descriptor.value;

	descriptor.value = async function (...args: any[]) {
		const start = performance.now();
		console.log(`[${target.constructor.name}] Executing ${propertyKey}...`);

		try {
			const result = await originalMethod.apply(this, args);

			const duration = (performance.now() - start).toFixed(2);
			console.log(`[${target.constructor.name}] ${propertyKey} Success (${duration}ms)`);

			return result;
		} catch (error) {
			console.error(`[${target.constructor.name}] ${propertyKey} Failed:`, error);
			throw error;
		}
	};

	return descriptor;
}
