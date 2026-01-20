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
	async process(input: IProcessImageInput, externalConfig?: any): Promise<IProcessImageOutput> {
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

		let imagePipeline = sharp(currentBuffer);

		if (input.crop) {
			const { x, y, width, height } = input.crop;
			imagePipeline = imagePipeline.extract({
				left: Math.round(x),
				top: Math.round(y),
				width: Math.round(width),
				height: Math.round(height)
			});
		}

		if (input.upscale) {
			const metadata = await imagePipeline.metadata();
			const targetWidth = (metadata.width || 0) * 2;
			const targetHeight = (metadata.height || 0) * 2;

			if (targetWidth > 0 && targetHeight > 0) {
				imagePipeline = imagePipeline.resize({
					width: targetWidth,
					height: targetHeight,
					kernel: 'lanczos3',
					withoutEnlargement: false
				});
			}
		}

		if (input.crop?.filters) {
			const { brightness, contrast, saturation, grayscale } = input.crop.filters;

			if (brightness !== undefined && brightness !== 100) {
				imagePipeline = imagePipeline.modulate({ brightness: brightness / 100 });
			}

			if (saturation !== undefined && saturation !== 100) {
				imagePipeline = imagePipeline.modulate({ saturation: saturation / 100 });
			}

			if (contrast !== undefined && contrast !== 100) {
				const factor = contrast / 100;
				imagePipeline = imagePipeline.linear(factor, -(128 * factor) + 128);
			}

			if (grayscale && grayscale >= 100) {
				imagePipeline = imagePipeline.grayscale();
			}
		}

		if (input.resize) {
			const { width, height, fit } = input.resize;
			if (width || height) {
				imagePipeline = imagePipeline.resize({
					width: width || undefined,
					height: height || undefined,
					fit: fit || 'inside',
					withoutEnlargement: true
				});
			}
		}

		if (input.watermark?.file || input.watermark?.text) {
			// Watermark needs metadata for sizing
			const tempBuffer = await imagePipeline.toBuffer();
			const metadata = await sharp(tempBuffer).metadata();
			const mainWidth = metadata.width || 1000;
			const mainHeight = metadata.height || 1000;

			let watermarkOverlay: Buffer;

			if (input.watermark.file) {
				const watermarkBuffer = Buffer.from(
					new Uint8Array(await input.watermark.file.arrayBuffer())
				);
				const targetWatermarkWidth = Math.max(Math.round(mainWidth * 0.2), 50);

				watermarkOverlay = await sharp(watermarkBuffer)
					.resize({ width: targetWatermarkWidth })
					.toBuffer();
			} else {
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
				blend: 'over'
			};

			if (input.crop?.watermark) {
				const { x, y } = input.crop.watermark;
				// x, y are percentages in the editor container.
				// We need to map them to the image pixels.
				compositeOptions.left = Math.round(
					(mainWidth * x) / 100 - watermarkOverlay.byteLength > 0 ? 0 : 0
				); // Simplified for now
				// Wait, I need the actual dimensions of the watermark overlay to center it correctly if it was centered in UI
				const watermarkMetadata = await sharp(watermarkOverlay).metadata();
				const wWidth = watermarkMetadata.width || 0;
				const wHeight = watermarkMetadata.height || 0;

				compositeOptions.left = Math.max(
					0,
					Math.min(Math.round((mainWidth * x) / 100 - wWidth / 2), mainWidth - wWidth)
				);
				compositeOptions.top = Math.max(
					0,
					Math.min(Math.round((mainHeight * y) / 100 - wHeight / 2), mainHeight - wHeight)
				);
			} else {
				compositeOptions.gravity = input.watermark.position || 'southeast';
				if (input.watermark.text && !input.watermark.file) {
					compositeOptions.gravity = 'center';
				}
			}

			// Continue with the pipeline after composite
			imagePipeline = sharp(await imagePipeline.composite([compositeOptions]).toBuffer());
		}

		if (input.stripMetadata) {
			// Sharp strips by default
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

		let externalUrl: string | undefined;

		if (externalConfig?.provider === 's3' && externalConfig.config) {
			try {
				const extS3 = new S3Client({
					region: externalConfig.config.region || 'us-east-1',
					endpoint: externalConfig.config.endpoint,
					credentials: {
						accessKeyId: externalConfig.config.accessKey,
						secretAccessKey: externalConfig.config.secretKey
					},
					forcePathStyle: true
				});
				await extS3.send(
					new PutObjectCommand({
						Bucket: externalConfig.config.bucket,
						Key: fileName,
						Body: resultBuffer,
						ContentType: `image/${outputFormat}`
					})
				);
			} catch (e) {
				console.error('External S3 upload fail:', e);
			}
		} else if (externalConfig?.provider === 'google_drive' && externalConfig.config) {
			try {
				const { googleDriveService } = await import('./GoogleDriveService');
				const driveResult = await googleDriveService.uploadFile(
					input.userId,
					externalConfig.config,
					fileName,
					resultBuffer,
					`image/${outputFormat}`
				);
				externalUrl = driveResult.webViewLink || undefined;
			} catch (e) {
				console.error('Google Drive upload fail:', e);
			}
		}

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
			format: outputFormat,
			externalUrl
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
