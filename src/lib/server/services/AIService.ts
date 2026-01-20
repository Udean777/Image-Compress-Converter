import type { ImageFormat } from '../../types/image.types';

export class AIService {
	/**
	 * Generates a descriptive alt-text for an image.
	 * In a real-world scenario, this would use Gemini Vision or OpenAI GPT-4o.
	 * For now, it uses a smart heuristic based on filename and metadata.
	 */
	async generateAltText(fileName: string, format: string, size: number): Promise<string> {
		// Mock AI logic: In production, upload to vision API here
		const cleanName = fileName.split('.')[0].replace(/[-_]/g, ' ').replace(/\d+/g, '').trim();

		const capitalized = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

		// Heuristic additions
		let suffix = 'image';
		if (format === 'png') suffix = 'graphic/illustration';
		if (size > 1024 * 1024) suffix += ' (high resolution)';

		return `${capitalized} ${suffix}`;
	}

	/**
	 * Suggests optimal compression quality based on image characteristics.
	 */
	async suggestCompression(format: ImageFormat, size: number): Promise<number> {
		// Heuristic: Larger files can afford more compression
		// PNGs often benefit from palette-based compression
		let suggestedQuality = 80;

		if (size > 5 * 1024 * 1024) {
			// > 5MB
			suggestedQuality = 70;
		} else if (size < 500 * 1024) {
			// < 500KB
			suggestedQuality = 90;
		}

		return suggestedQuality;
	}

	/**
	 * Simulates AI-based super resolution (upscaling).
	 * On the server, we use Sharp's Lanczos3 kernel which is very high quality.
	 */
	getUpscaleFactor(): number {
		return 2;
	}
}
