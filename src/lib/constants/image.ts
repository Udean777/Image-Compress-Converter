export const TIER_HIERARCHY = ['free', 'starter', 'pro', 'business'] as const;
export type PlanTier = (typeof TIER_HIERARCHY)[number];

export const IMAGE_ACTIONS = [
	{ value: 'compress', label: '🗜️ Compress Only', minTier: 'free' },
	{ value: 'convert', label: '🔄 Convert Format', minTier: 'free' },
	{ value: 'remove_bg', label: '✂️ Remove Background', minTier: 'pro' },
	{ value: 'watermark', label: '🖼️ Add Watermark', minTier: 'pro' }
] as const;

export function isFeatureAllowed(userTier: string, minTier: string): boolean {
	const userIdx = TIER_HIERARCHY.indexOf(userTier as PlanTier);
	const minIdx = TIER_HIERARCHY.indexOf(minTier as PlanTier);
	return userIdx >= minIdx;
}

export const IMAGE_FORMATS = [
	{ value: 'jpg', label: 'JPG' },
	{ value: 'png', label: 'PNG' },
	{ value: 'webp', label: 'WEBP' },
	{ value: 'avif', label: 'AVIF' }
] as const;

export type ImageAction = (typeof IMAGE_ACTIONS)[number]['value'];
export type ImageFormat = (typeof IMAGE_FORMATS)[number]['value'];

export const TIER_LIMITS = {
	free: { maxFileSize: 5 * 1024 * 1024, maxQuality: 85 },
	starter: { maxFileSize: 10 * 1024 * 1024, maxQuality: 100 },
	pro: { maxFileSize: 25 * 1024 * 1024, maxQuality: 100 },
	business: { maxFileSize: 100 * 1024 * 1024, maxQuality: 100 }
} as const;
