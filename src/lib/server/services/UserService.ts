import type { PrismaClient } from '@prisma/client';
import { LogExecution } from '../decorators';
import { prisma } from '../db';

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
					creditsUsed: COST_PER_ACTION
				}
			});

			return updateUser;
		});
	}

	async getUserHistory(userId: string) {
		return await this.db.history.findMany({
			where: {
				userId
			},
			orderBy: {
				createdAt: 'desc'
			},
			take: 10
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
}
