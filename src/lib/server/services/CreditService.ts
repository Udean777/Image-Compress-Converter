import type { PrismaClient, CreditTransaction } from '@prisma/client';
import { prisma } from '../db';

type CreditType = 'subscription_renew' | 'usage' | 'expired' | 'bonus' | 'refund';

export interface CreditBalance {
	total: number;
	subscriptionCredits: number;
}

export interface AddCreditsResult {
	newBalance: number;
	transaction: CreditTransaction;
}

export class CreditService {
	private db: PrismaClient;

	constructor(database: PrismaClient = prisma) {
		this.db = database;
	}

	async getBalance(userId: string): Promise<number> {
		const user = await this.db.user.findUnique({
			where: { id: userId },
			select: { credits: true }
		});

		return user?.credits ?? 0;
	}

	async addCredits(
		userId: string,
		amount: number,
		type: CreditType,
		description?: string,
		referenceId?: string
	): Promise<AddCreditsResult> {
		const result = await this.db.$transaction(async (tx) => {
			// Idempotency check: jika referenceId sudah ada, jangan tambah lagi
			if (referenceId) {
				const existingTransaction = await tx.creditTransaction.findFirst({
					where: { referenceId, type }
				});

				if (existingTransaction) {
					const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
					return { newBalance: user.credits, transaction: existingTransaction };
				}
			}

			const user = await tx.user.update({
				where: { id: userId },
				data: { credits: { increment: amount } }
			});

			const transaction = await tx.creditTransaction.create({
				data: {
					userId,
					amount,
					type,
					description: description ?? `Added ${amount} credits`,
					referenceId
				}
			});

			return { newBalance: user.credits, transaction };
		});

		return result;
	}

	async deductCredits(
		userId: string,
		amount: number,
		description?: string,
		referenceId?: string
	): Promise<number> {
		const result = await this.db.$transaction(async (tx) => {
			const user = await tx.user.findUniqueOrThrow({
				where: { id: userId }
			});

			if (user.credits < amount) {
				throw new Error('Insufficient credits');
			}

			const updateUser = await tx.user.update({
				where: { id: userId },
				data: { credits: { decrement: amount } }
			});

			await tx.creditTransaction.create({
				data: {
					userId,
					amount: -amount,
					type: 'usage',
					description: description ?? `Used ${amount} credit(s)`,
					referenceId
				}
			});

			return updateUser.credits;
		});

		return result;
	}

	async expireCredits(userId: string, subscriptionId: string): Promise<number> {
		const result = await this.db.$transaction(async (tx) => {
			const user = await tx.user.findUniqueOrThrow({
				where: { id: userId }
			});

			const expiredAmount = user.credits;

			if (expiredAmount <= 0) {
				return 0;
			}

			await tx.user.update({
				where: { id: userId },
				data: { credits: 0 }
			});

			await tx.creditTransaction.create({
				data: {
					userId,
					amount: -expiredAmount,
					type: 'expired',
					description: `Expired ${expiredAmount} unused credits`,
					referenceId: subscriptionId
				}
			});

			return expiredAmount;
		});

		return result;
	}

	async getTransactions(
		userId: string,
		limit: number = 20,
		offset: number = 0
	): Promise<CreditTransaction[]> {
		return this.db.creditTransaction.findMany({
			where: { userId },
			orderBy: { createdAt: 'desc' },
			take: limit,
			skip: offset
		});
	}

	async getTransactionSummary(
		userId: string,
		startDate: Date,
		endDate: Date
	): Promise<{ added: number; used: number; expired: number }> {
		const transactions = await this.db.creditTransaction.findMany({
			where: {
				userId,
				createdAt: {
					gte: startDate,
					lte: endDate
				}
			}
		});

		return transactions.reduce(
			(acc, tx) => {
				if (tx.type === 'expired') {
					acc.expired += Math.abs(tx.amount);
				} else if (tx.amount > 0) {
					acc.added += tx.amount;
				} else {
					acc.used += Math.abs(tx.amount);
				}
				return acc;
			},
			{ added: 0, used: 0, expired: 0 }
		);
	}
}

export const creditService = new CreditService();
