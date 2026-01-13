import sharp from 'sharp';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
	ProcessType,
	type IProcessImageInput,
	type IProcessImageOutput,
	ImageFormat
} from '../../types/image.types';
import { LogExecution } from '../decorators';

import { env } from '$env/dynamic/private';

export class ImageService {
	private s3: S3Client;
	private bucket: string;

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

		this.bucket = env.S3_BUCKET;
	}

	@LogExecution
	async process(input: IProcessImageInput): Promise<IProcessImageOutput> {
		let currentBuffer: Buffer | ArrayBuffer = await input.file.arrayBuffer();
		if (!Buffer.isBuffer(currentBuffer)) {
			currentBuffer = Buffer.from(new Uint8Array(currentBuffer));
		}

		const originalSize = input.file.size;
		const quality = input.quality || 80;
		let outputFormat = input.targetFormat || ImageFormat.JPEG;

		if (input.type === ProcessType.REMOVE_BG) {
			try {
				const blob = new Blob([new Uint8Array(currentBuffer)], { type: input.file.type });
				currentBuffer = await this.removeBackgroundFunc(blob);
				outputFormat = ImageFormat.PNG;
			} catch (e) {
				console.warn('API Remove BG Error', e);
				throw new Error('Background removal service unavailable');
			}
		}

		if (input.resize) {
			const { width, height, fit } = input.resize;
			if (width || height) {
				currentBuffer = await sharp(currentBuffer)
					.resize({
						width: width || undefined,
						height: height || undefined,
						fit: fit || 'inside',
						withoutEnlargement: true
					})
					.toBuffer();
			}
		}

		if (input.watermark?.file || input.watermark?.text) {
			const mainImageMetadata = await sharp(currentBuffer).metadata();
			const mainWidth = mainImageMetadata.width || 1000;
			const mainHeight = mainImageMetadata.height || 1000;

			let watermarkOverlay: Buffer;

			if (input.watermark.file) {
				const watermarkBuffer = Buffer.from(
					new Uint8Array(await input.watermark.file.arrayBuffer())
				);
				const targetWatermarkWidth = Math.max(Math.round(mainWidth * 0.2), 50); // Min 50px

				watermarkOverlay = await sharp(watermarkBuffer)
					.resize({ width: targetWatermarkWidth })
					.toBuffer();
			} else {
				// Text Watermark
				const text = input.watermark.text || '';
				const color = input.watermark.textColor || 'white';
				const size = input.watermark.textSize || Math.max(Math.round(mainWidth * 0.05), 20);
				const opacity = input.watermark.opacity || 0.5;

				const svg = `
					<svg width="${mainWidth}" height="${mainHeight}">
						<style>
							.title { fill: ${color}; font-size: ${size}px; font-weight: bold; opacity: ${opacity}; font-family: sans-serif; }
						</style>
						<text x="50%" y="50%" text-anchor="middle" class="title">${text}</text>
					</svg>
				`;
				watermarkOverlay = Buffer.from(svg);
			}

			const compositeOptions: any = {
				input: watermarkOverlay,
				gravity: input.watermark.position || 'southeast',
				blend: 'over'
			};

			// If it's a full-size SVG text overlay, we don't want gravity to move it if it's already centered in SVG
			if (input.watermark.text && !input.watermark.file) {
				compositeOptions.gravity = 'center';
			}

			currentBuffer = await sharp(currentBuffer).composite([compositeOptions]).toBuffer();
		}

		let imagePipeline = sharp(currentBuffer);

		if (input.stripMetadata) {
			// Do nothing, sharp strips by default unless .withMetadata() is called
		} else {
			imagePipeline = imagePipeline.withMetadata();
		}

		if (input.type === ProcessType.COMPRESS && !input.targetFormat) {
			const metadata = await imagePipeline.metadata();
			outputFormat = (metadata.format as ImageFormat) || ImageFormat.JPG;
		}

		switch (outputFormat) {
			case ImageFormat.JPG:
			case 'jpeg':
				imagePipeline = imagePipeline.jpeg({ quality });
				break;
			case ImageFormat.PNG:
				imagePipeline = imagePipeline.png({ compressionLevel: 8, palette: true });
				break;
			case ImageFormat.WEBP:
				imagePipeline = imagePipeline.webp({ quality });
				break;
			case ImageFormat.AVIF:
				imagePipeline = imagePipeline.avif({ quality });
				break;
		}

		const resultBuffer = await imagePipeline.toBuffer();
		const timestamp = Date.now();
		const uniqueSuffix = Math.random().toString(36).substring(7);
		const fileName = `users/${input.userId}/${timestamp}-${uniqueSuffix}.${outputFormat}`;

		await this.s3.send(
			new PutObjectCommand({
				Bucket: this.bucket,
				Key: fileName,
				Body: resultBuffer,
				ContentType: `image/${outputFormat}`
			})
		);

		const [publicUrl, downloadUrl] = await Promise.all([
			this.generatePresignedUrl(fileName, false),
			this.generatePresignedUrl(fileName, true)
		]);

		return {
			fileName,
			publicUrl,
			downloadUrl,
			originalSize,
			newSize: resultBuffer.byteLength,
			format: outputFormat
		};
	}

	async generatePresignedUrl(key: string, asAttachment = false): Promise<string> {
		const command = new GetObjectCommand({
			Bucket: this.bucket,
			Key: key,
			ResponseContentDisposition: asAttachment ? 'attachment' : undefined
		});

		return await getSignedUrl(this.s3, command, {
			expiresIn: 60 * 60 // 1 hour
		});
	}

	private async removeBackgroundFunc(input: ArrayBuffer | Buffer | Blob): Promise<Buffer> {
		const { removeBackground } = await import('@imgly/background-removal-node');

		let processInput: Blob | Buffer;

		if (input instanceof Blob) {
			processInput = input;
		} else if (Buffer.isBuffer(input)) {
			processInput = input;
		} else {
			processInput = Buffer.from(new Uint8Array(input as ArrayBuffer));
		}

		console.log('Processing background removal with input type:', input.constructor.name);

		const blob = await removeBackground(processInput);

		return Buffer.from(await blob.arrayBuffer());
	}
}
