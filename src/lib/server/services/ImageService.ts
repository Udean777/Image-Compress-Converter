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

export class ImageService {
	private s3: S3Client;
	private bucket: string;

	constructor() {
		this.s3 = new S3Client({
			region: process.env.S3_REGION || 'us-east-1',
			endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
			credentials: {
				accessKeyId: process.env.S3_ACCESS_KEY || 'miniouser',
				secretAccessKey: process.env.S3_SECRET_KEY || 'miniopassword'
			},
			forcePathStyle: true
		});

		this.bucket = process.env.S3_BUCKET || 'saas-bucket';
	}

	@LogExecution
	async process(input: IProcessImageInput): Promise<IProcessImageOutput> {
		const buffer = await input.file.arrayBuffer();
		const originalSize = input.file.size;

		let imagePipeline = sharp(buffer);
		let outputFormat = input.targetFormat || ImageFormat.JPEG;

		if (input.type === ProcessType.COMPRESS) {
			const metadata = await imagePipeline.metadata();
			outputFormat = (metadata.format as ImageFormat) || ImageFormat.JPG;
		}

		switch (outputFormat) {
			case ImageFormat.JPG:
			case 'jpeg':
				imagePipeline = imagePipeline.jpeg({ quality: 60, mozjpeg: true });
				break;
			case ImageFormat.PNG:
				imagePipeline = imagePipeline.png({ compressionLevel: 8, palette: true });
				break;
			case ImageFormat.WEBP:
				imagePipeline = imagePipeline.webp({ quality: 60 });
				break;
		}

		const resultBuffer = await imagePipeline.toBuffer();
		const timestamp = Date.now();
		const fileName = `users/${input.userId}/${timestamp}.${outputFormat}`;

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
}
