import type { PrismaClient } from '@prisma/client';
import { LogExecution } from '../decorators';
import { prisma } from '../db';

// History expires after 7 days by default
const HISTORY_EXPIRY_DAYS = 7;

export class UserService {
	private db: PrismaClient;

	constructor(database: PrismaClient = prisma) {
		this.db = database;
	}

	async getUserCredits(userId: string): Promise<number> {
		const user = await this.db.user.findUnique({
			where: {
				id: userId
			},
			select: { credits: true }
		});

		return user?.credits || 0;
	}

	@LogExecution
	async recordActivity(
		userId: string,
		action: string,
		outputFormat: string,
		fileName: string,
		outputUrl: string
	) {
		const COST_PER_ACTION = 1;

		// Calculate expiration date (7 days from now)
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + HISTORY_EXPIRY_DAYS);

		return await this.db.$transaction(async (tx) => {
			const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });

			if (user.credits < COST_PER_ACTION) {
				throw new Error('Insufficient credits');
			}

			const updateUser = await tx.user.update({
				where: { id: userId },
				data: { credits: { decrement: COST_PER_ACTION } }
			});

			await tx.history.create({
				data: {
					userId,
					action,
					outputFormat,
					fileName,
					outputUrl,
					creditsUsed: COST_PER_ACTION,
					expiresAt,
					isPermanent: false
				}
			});

			return updateUser;
		});
	}

	async getUserHistory(userId: string) {
		return await this.db.history.findMany({
			where: {
				userId,
				// Only show non-expired or permanent histories
				OR: [{ isPermanent: true }, { expiresAt: { gte: new Date() } }, { expiresAt: null }]
			},
			orderBy: {
				createdAt: 'desc'
			},
			take: 20
		});
	}

	async deleteHistory(historyId: string, userId: string) {
		return await this.db.history.deleteMany({
			where: {
				id: historyId,
				userId: userId
			}
		});
	}

	/**
	 * Mark a history item as permanent (will not be auto-deleted)
	 */
	async markHistoryPermanent(historyId: string, userId: string, isPermanent: boolean = true) {
		return await this.db.history.updateMany({
			where: {
				id: historyId,
				userId: userId
			},
			data: {
				isPermanent,
				expiresAt: isPermanent
					? null
					: new Date(Date.now() + HISTORY_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
			}
		});
	}

	/**
	 * Cleanup expired history items (to be called by a cron job or scheduled task)
	 */
	async cleanupExpiredHistory(): Promise<number> {
		const result = await this.db.history.deleteMany({
			where: {
				isPermanent: false,
				expiresAt: {
					lt: new Date()
				}
			}
		});

		console.log(`[UserService] Cleaned up ${result.count} expired history items`);
		return result.count;
	}
}
