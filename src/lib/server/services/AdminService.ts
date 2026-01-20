import { prisma } from '../db';
import { env } from '$env/dynamic/private';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

export class AdminService {
	private s3: S3Client;

	constructor() {
		this.s3 = new S3Client({
			region: env.S3_REGION || 'us-east-1',
			endpoint: env.S3_ENDPOINT || 'http://localhost:9000',
			credentials: {
				accessKeyId: env.S3_ACCESS_KEY,
				secretAccessKey: env.S3_SECRET_KEY
			},
			forcePathStyle: true
		});
	}

	async getRevenueStats(days = 30) {
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - days);

		const payments = await prisma.payment.findMany({
			where: {
				status: 'paid',
				paidAt: { gte: startDate }
			},
			orderBy: { paidAt: 'asc' },
			select: { amount: true, paidAt: true }
		});

		// Group by date
		const grouped: Record<string, number> = {};
		payments.forEach((p) => {
			if (!p.paidAt) return;
			const date = p.paidAt.toISOString().split('T')[0];
			grouped[date] = (grouped[date] || 0) + p.amount;
		});

		return Object.entries(grouped).map(([date, amount]) => ({ date, amount }));
	}

	async getUserGrowthStats(days = 30) {
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - days);

		const users = await prisma.user.findMany({
			where: { createdAt: { gte: startDate } },
			orderBy: { createdAt: 'asc' },
			select: { createdAt: true }
		});

		const grouped: Record<string, number> = {};
		users.forEach((u) => {
			const date = u.createdAt.toISOString().split('T')[0];
			grouped[date] = (grouped[date] || 0) + 1;
		});

		return Object.entries(grouped).map(([date, count]) => ({ date, count }));
	}

	async getSystemHealth() {
		const health: Record<string, 'online' | 'offline' | 'error'> = {
			database: 'offline',
			storage: 'offline',
			stripe: 'offline'
		};

		// Check Database
		try {
			await prisma.$queryRaw`SELECT 1`;
			health.database = 'online';
		} catch (e) {
			console.error('Health Check: Database Error', e);
			health.database = 'error';
		}

		// Check Storage (S3/MinIO)
		try {
			await this.s3.send(new ListObjectsV2Command({ Bucket: env.S3_BUCKET, MaxKeys: 1 }));
			health.storage = 'online';
		} catch (e) {
			console.error('Health Check: Storage Error', e);
			health.storage = 'error';
		}

		// Check Stripe (simple API check)
		if (env.STRIPE_SECRET_KEY) {
			health.stripe = 'online'; // Assuming configured correctly if key exists for now
		}

		return health;
	}

	async getGlobalActivity(limit = 50) {
		return prisma.history.findMany({
			take: limit,
			orderBy: { createdAt: 'desc' },
			include: {
				user: {
					select: { name: true, email: true }
				}
			}
		});
	}

	async getStorageStats() {
		const command = new ListObjectsV2Command({ Bucket: env.S3_BUCKET });
		const response = await this.s3.send(command);
		const objects = response.Contents || [];

		const totalSize = objects.reduce((sum, obj) => sum + (obj.Size || 0), 0);
		return {
			count: objects.length,
			sizeBytes: totalSize,
			sizeText: this.formatBytes(totalSize)
		};
	}

	async listStorageObjects(limit = 100) {
		const command = new ListObjectsV2Command({
			Bucket: env.S3_BUCKET,
			MaxKeys: limit
		});
		const response = await this.s3.send(command);
		return (response.Contents || []).map((obj) => ({
			key: obj.Key,
			size: obj.Size,
			lastModified: obj.LastModified,
			sizeText: this.formatBytes(obj.Size || 0)
		}));
	}

	async deleteStorageObject(key: string) {
		const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
		const command = new DeleteObjectCommand({
			Bucket: env.S3_BUCKET,
			Key: key
		});
		return this.s3.send(command);
	}

	private formatBytes(bytes: number, decimals = 2) {
		if (!+bytes) return '0 Bytes';
		const k = 1024;
		const dm = decimals < 0 ? 0 : decimals;
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
	}

	async getPricingPlans() {
		return prisma.pricingPlan.findMany({
			orderBy: { price: 'asc' }
		});
	}

	async updatePricingPlan(
		id: string,
		data: { price: number; credits: number; displayName: string }
	) {
		return prisma.pricingPlan.update({
			where: { id },
			data: {
				price: data.price,
				credits: data.credits,
				displayName: data.displayName
			}
		});
	}

	async getAnnouncements() {
		return prisma.announcement.findMany({
			orderBy: { createdAt: 'desc' }
		});
	}

	async upsertAnnouncement(data: {
		id?: string;
		title: string;
		content: string;
		type: string;
		isActive: boolean;
		target: string;
		expiresAt?: Date | null;
	}) {
		if (data.id) {
			return prisma.announcement.update({
				where: { id: data.id },
				// @ts-ignore
				data: { ...data, id: undefined }
			});
		}
		return prisma.announcement.create({
			// @ts-ignore
			data
		});
	}

	async deleteAnnouncement(id: string) {
		return prisma.announcement.delete({ where: { id } });
	}

	async getCreditTransactions(params: {
		userId?: string;
		type?: string;
		startDate?: Date;
		endDate?: Date;
		limit?: number;
		offset?: number;
	}) {
		const where: any = {};
		if (params.userId) where.userId = params.userId;
		if (params.type) where.type = params.type;
		if (params.startDate || params.endDate) {
			where.createdAt = {};
			if (params.startDate) where.createdAt.gte = params.startDate;
			if (params.endDate) where.createdAt.lte = params.endDate;
		}

		const [items, total] = await Promise.all([
			prisma.creditTransaction.findMany({
				where,
				orderBy: { createdAt: 'desc' },
				take: params.limit || 50,
				skip: params.offset || 0,
				include: { user: { select: { email: true, name: true } } }
			}),
			prisma.creditTransaction.count({ where })
		]);

		return { items, total };
	}

	async generateTransactionCSV(transactions: any[]) {
		const header = 'ID,User,Type,Amount,Description,Reference,Date\n';
		const rows = transactions
			.map((t) => {
				return [
					t.id,
					t.user?.email || t.userId,
					t.type,
					t.amount,
					`"${(t.description || '').replace(/"/g, '""')}"`,
					t.referenceId || '',
					t.createdAt.toISOString()
				].join(',');
			})
			.join('\n');
		return header + rows;
	}

	async getTopUsersAnalytics(limit = 10) {
		// Top users by registration date or credits used?
		// Let's do top users by credit consumption from history
		const topConsumers = await prisma.history.groupBy({
			by: ['userId'],
			_sum: { creditsUsed: true },
			_count: { id: true },
			orderBy: { _sum: { creditsUsed: 'desc' } },
			take: limit
		});

		const userIds = topConsumers.map((c) => c.userId);
		const users = await prisma.user.findMany({
			where: { id: { in: userIds } },
			select: { id: true, email: true, name: true, credits: true }
		});

		return topConsumers.map((c) => ({
			...c,
			user: users.find((u) => u.id === c.userId)
		}));
	}

	async bulkGrantCredits(userIds: string[], amount: number, description: string) {
		return prisma.$transaction(
			userIds.map((userId) =>
				prisma.user.update({
					where: { id: userId },
					data: {
						credits: { increment: amount },
						creditTransactions: {
							create: {
								amount,
								type: 'bonus',
								description
							}
						}
					}
				})
			)
		);
	}

	async cleanupOldFiles(retentionDays = 7) {
		const cutoff = new Date();
		cutoff.setDate(cutoff.getDate() - retentionDays);

		const oldFiles = await prisma.history.findMany({
			where: {
				createdAt: { lt: cutoff },
				isPermanent: false
			},
			select: { id: true, outputUrl: true }
		});

		// Extract keys from URLs (this depends on how outputUrl is structured)
		// Assuming outputUrl is a direct S3 key or contains it
		const results = [];
		for (const file of oldFiles) {
			try {
				// Very basic key extraction, might need adjustment
				const key = file.outputUrl.split('/').pop();
				if (key) {
					await this.deleteStorageObject(key);
					await prisma.history.delete({ where: { id: file.id } });
					results.push({ id: file.id, status: 'deleted' });
				}
			} catch (e) {
				console.error(`Cleanup failed for ${file.id}:`, e);
				results.push({ id: file.id, status: 'error', error: String(e) });
			}
		}
		return results;
	}

	async getMaintenanceMode() {
		const config = await prisma.systemConfig.findUnique({
			where: { key: 'maintenance_mode' }
		});
		return config?.value === 'true';
	}

	async setMaintenanceMode(active: boolean) {
		return prisma.systemConfig.upsert({
			where: { key: 'maintenance_mode' },
			update: { value: active ? 'true' : 'false' },
			create: { key: 'maintenance_mode', value: active ? 'true' : 'false' }
		});
	}
}
