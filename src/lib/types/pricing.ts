export type TierName = 'free' | 'starter' | 'pro' | 'business';

export type CreditTransactionType = 'subscription_renew' | 'usage' | 'expired' | 'bonus' | 'refund';

export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'past_due';

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'expired';

export interface PlanFeatures {
	compress: boolean;
	convert: boolean;
	resize: boolean;
	removeBg: boolean;
	watermark: boolean;
	apiAccess: boolean;
	batchProcessing: boolean;
}

export const TIER_FEATURES: Record<TierName, PlanFeatures> = {
	free: {
		compress: true,
		convert: true,
		resize: true,
		removeBg: false,
		watermark: false,
		apiAccess: false,
		batchProcessing: false
	},
	starter: {
		compress: true,
		convert: true,
		resize: true,
		removeBg: false,
		watermark: false,
		apiAccess: false,
		batchProcessing: false
	},
	pro: {
		compress: true,
		convert: true,
		resize: true,
		removeBg: true,
		watermark: true,
		apiAccess: false,
		batchProcessing: false
	},
	business: {
		compress: true,
		convert: true,
		resize: true,
		removeBg: true,
		watermark: true,
		apiAccess: true,
		batchProcessing: true
	}
};
