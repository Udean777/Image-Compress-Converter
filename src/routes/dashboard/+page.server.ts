import { ImageService } from '$lib/server/services/ImageService';
import { UserService } from '$lib/server/services/UserService';
import { AIService } from '$lib/server/services/AIService';
import { CloudConnectorService } from '$lib/server/services/CloudConnectorService';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { prisma } from '$lib/server/db';
import { ProcessType, type ImageFormat } from '$lib/types/image.types';
import { IMAGE_ACTIONS, isFeatureAllowed, TIER_LIMITS } from '$lib/constants';

const imageService = new ImageService();
const userService = new UserService();
const aiService = new AIService();
const connectorService = new CloudConnectorService();

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { user } = await parent();
	if (!locals.user) throw redirect(303, '/');

	const historyRaw = await userService.getUserHistory(locals.user.id);
	const connectors = await connectorService.getActiveConfigs(locals.user.id);

	const history = await Promise.all(
		historyRaw.map(async (item) => {
			const freshUrl = await imageService.generatePresignedUrl(item.fileName, true);
			return { ...item, outputUrl: freshUrl };
		})
	);

	return {
		user,
		history,
		connectors
	};
};

export const actions: Actions = {
	process: async ({ locals, request }) => {
		if (!locals.user) return fail(401, { message: 'Unauthorized' });

		const user = locals.user;
		const formData = await request.formData();

		const files = formData.getAll('images') as File[];
		const type = formData.get('action') as ProcessType;
		const targetFormat = formData.get('format') as ImageFormat;
		let qualityValue = parseInt(formData.get('quality') as string) || 80;
		const width = formData.get('width') ? parseInt(formData.get('width') as string) : undefined;
		const height = formData.get('height') ? parseInt(formData.get('height') as string) : undefined;
		const watermarkFile = formData.get('watermark') as File;
		const watermarkText = formData.get('watermarkText') as string;
		const watermarkPosition = formData.get('watermarkPosition') as any;
		const stripMetadata = formData.get('stripMetadata') === 'on';

		// AI Flags
		const generateAltText = formData.get('generateAltText') === 'true';
		const upscale = formData.get('upscale') === 'true';
		const smartCompression = formData.get('smartCompression') === 'true';

		// Cloud Destination
		const destinationProvider = formData.get('destination') as string; // e.g. 's3', 'google_drive'
		let externalConfig = null;
		if (destinationProvider && destinationProvider !== 'default') {
			externalConfig = await connectorService.getConfig(user.id, destinationProvider);
		}

		const userTier = user.planTier || 'free';
		const limits = TIER_LIMITS[userTier as keyof typeof TIER_LIMITS];

		// Enforcement 1: Action Permission
		const selectedAction = IMAGE_ACTIONS.find((a) => a.value === type);
		if (selectedAction && !isFeatureAllowed(userTier, selectedAction.minTier)) {
			return fail(403, { message: `Feature "${selectedAction.label}" required Pro plan.` });
		}

		// Enforcement 2: Quality Cap
		if (qualityValue > limits.maxQuality) qualityValue = limits.maxQuality;

		if (!files || files.length === 0 || files[0].size === 0) {
			return fail(400, { message: 'No images selected' });
		}

		const currentCredits = await userService.getUserCredits(user.id);
		if (currentCredits < files.length) {
			return fail(400, { message: `Insufficient credits.` });
		}

		try {
			const results = await Promise.all(
				files.map(async (file, index) => {
					// Get crop data
					const cropDataRaw = formData.get(`crop_${index}`) as string;
					const crop = cropDataRaw ? JSON.parse(cropDataRaw) : undefined;

					let finalQuality = qualityValue;
					if (smartCompression) {
						finalQuality = await aiService.suggestCompression(targetFormat, file.size);
					}

					const result = await imageService.process(
						{
							file,
							type: type || ProcessType.COMPRESS,
							targetFormat,
							userId: user.id,
							quality: finalQuality,
							resize: width || height ? { width, height } : undefined,
							stripMetadata,
							crop,
							upscale,
							watermark:
								watermarkFile?.size > 0 || watermarkText
									? {
											file: watermarkFile?.size > 0 ? watermarkFile : undefined,
											text: watermarkText || undefined,
											position: watermarkPosition || 'southeast'
										}
									: undefined
						},
						externalConfig
					);

					if (generateAltText) {
						result.altText = await aiService.generateAltText(file.name, targetFormat, file.size);
					}

					await userService.recordActivity(
						user.id,
						type,
						targetFormat,
						result.fileName,
						result.publicUrl
					);

					return {
						url: result.publicUrl,
						downloadUrl: result.downloadUrl,
						originalSize: result.originalSize,
						newSize: result.newSize,
						format: result.format,
						altText: result.altText,
						stats: `Saved ${(100 - (result.newSize / result.originalSize) * 100).toFixed(1)}%`
					};
				})
			);

			return {
				success: true,
				newCredits: currentCredits - files.length,
				results
			};
		} catch (error: any) {
			console.error(error);
			return fail(500, { message: error.message || 'Processing failed' });
		}
	},

	delete: async ({ locals, request }) => {
		if (!locals.user) return fail(401, { message: 'Unauthorized' });

		const formData = await request.formData();
		const historyId = formData.get('historyId') as string;

		if (!historyId) {
			return fail(400, { message: 'Invalid history ID' });
		}

		await userService.deleteHistory(historyId, locals.user.id);

		return { deleteSuccess: true };
	},

	logout: async ({ cookies }) => {
		const { performLogout } = await import('$lib/server/auth');
		await performLogout(cookies);
	},

	togglePermanent: async ({ locals, request }) => {
		if (!locals.user) return fail(401, { message: 'Unauthorized' });

		const formData = await request.formData();
		const historyId = formData.get('historyId') as string;
		const isPermanent = formData.get('isPermanent') === 'true';

		if (!historyId) {
			return fail(400, { message: 'Invalid history ID' });
		}

		await userService.markHistoryPermanent(historyId, locals.user.id, isPermanent);

		return { toggleSuccess: true };
	}
};
