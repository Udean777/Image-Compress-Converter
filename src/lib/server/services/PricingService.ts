import type { PrismaClient, PricingPlan, Subscription } from '@prisma/client';
import { prisma } from '../db';

const PRO_FEATURES = ['remove_bg', 'watermark'] as const;
const BUSINESS_FEATURES = ['api_access', 'batch_processing'] as const;

type ProFeature = (typeof PRO_FEATURES)[number];
type BusinessFeature = (typeof BUSINESS_FEATURES)[number];

type Feature = ProFeature | BusinessFeature;

type TierName = 'free' | 'starter' | 'pro' | 'business';

export interface PlanWithFeatures extends PricingPlan {
	parsedFeatures: string[];
}

export class PricingService {
	private db: PrismaClient;

	constructor(database: PrismaClient = prisma) {
		this.db = database;
	}

	async getPlans(): Promise<PlanWithFeatures[]> {
		const plans = await this.db.pricingPlan.findMany({
			where: { isActive: true },
			orderBy: { sortOrder: 'asc' }
		});

		return plans.map((plan) => ({
			...plan,
			parsedFeatures: this.parseFeatures(plan.features)
		}));
	}

	async getPlanByName(name: TierName): Promise<PricingPlan | null> {
		return this.db.pricingPlan.findUnique({
			where: { name }
		});
	}

	async getPlanById(planId: string): Promise<PricingPlan | null> {
		return this.db.pricingPlan.findUnique({
			where: { id: planId }
		});
	}

	async getUserSubscription(
		userId: string
	): Promise<(Subscription & { plan: PricingPlan }) | null> {
		return this.db.subscription.findFirst({
			where: {
				userId,
				status: 'active',
				currentPeriodEnd: { gte: new Date() }
			},
			include: { plan: true },
			orderBy: { createdAt: 'desc' }
		});
	}

	async getUserTier(userId: string): Promise<TierName> {
		const subscription = await this.getUserSubscription(userId);

		if (!subscription) return 'free';

		return subscription.plan.name as TierName;
	}

	async hasFeatureAccess(userId: string, feature: Feature): Promise<boolean> {
		const tier = await this.getUserTier(userId);

		if (tier === 'business') {
			return true;
		}

		if (tier === 'pro') {
			return PRO_FEATURES.includes(feature as ProFeature);
		}

		return false;
	}

	async hasActiveSubscription(userId: string): Promise<boolean> {
		const tier = await this.getUserTier(userId);

		return tier !== 'free';
	}

	getTierLevel(tierName: TierName): number {
		const levels: Record<TierName, number> = {
			free: 0,
			starter: 1,
			pro: 2,
			business: 3
		};

		return levels[tierName];
	}

	isTierAtLeast(userTier: TierName, requiredTier: TierName): boolean {
		return this.getTierLevel(userTier) >= this.getTierLevel(requiredTier);
	}

	private parseFeatures(features: unknown): string[] {
		if (!features) return [];

		if (typeof features === 'string') {
			try {
				return JSON.parse(features);
			} catch (error) {
				return [];
			}
		}

		if (Array.isArray(features)) {
			return features;
		}

		return [];
	}
}

export const pricingService = new PricingService();
