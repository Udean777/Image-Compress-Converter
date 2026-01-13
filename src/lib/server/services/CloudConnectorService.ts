import { prisma } from '$lib/server/db';

export class CloudConnectorService {
	async getConfig(userId: string, provider: string) {
		return await prisma.storageConfig.findUnique({
			where: {
				userId_provider: { userId, provider }
			}
		});
	}

	async saveConfig(userId: string, provider: string, config: any) {
		return await prisma.storageConfig.upsert({
			where: {
				userId_provider: { userId, provider }
			},
			update: { config, isActive: true },
			create: { userId, provider, config, isActive: true }
		});
	}

	async getActiveConfigs(userId: string) {
		return await prisma.storageConfig.findMany({
			where: { userId, isActive: true }
		});
	}

	async deactivateConfig(userId: string, provider: string) {
		return await prisma.storageConfig.update({
			where: {
				userId_provider: { userId, provider }
			},
			data: { isActive: false }
		});
	}
}
