import {
	S3Client,
	PutObjectCommand,
	HeadBucketCommand,
	CreateBucketCommand,
	PutBucketPolicyCommand
} from '@aws-sdk/client-s3';
import {
	S3_ENDPOINT,
	S3_REGION,
	S3_ACCESS_KEY,
	S3_SECRET_KEY,
	S3_BUCKET
} from '$env/static/private';

const s3 = new S3Client({
	region: S3_REGION,
	endpoint: S3_ENDPOINT,
	credentials: {
		accessKeyId: S3_ACCESS_KEY,
		secretAccessKey: S3_SECRET_KEY
	},
	forcePathStyle: true // Needed for MinIO
});

export async function ensurePublicBucket() {
	try {
		// Check if bucket exists
		try {
			await s3.send(new HeadBucketCommand({ Bucket: S3_BUCKET }));
		} catch (e) {
			// If not, create it
			await s3.send(new CreateBucketCommand({ Bucket: S3_BUCKET }));
		}

		// Set public read policy
		const policy = {
			Version: '2012-10-17',
			Statement: [
				{
					Sid: 'PublicRead',
					Effect: 'Allow',
					Principal: '*',
					Action: ['s3:GetObject'],
					Resource: [`arn:aws:s3:::${S3_BUCKET}/*`]
				}
			]
		};

		await s3.send(
			new PutBucketPolicyCommand({
				Bucket: S3_BUCKET,
				Policy: JSON.stringify(policy)
			})
		);
		console.log(`Bucket ${S3_BUCKET} policy set to public read`);
	} catch (error) {
		console.error('Failed to configure bucket:', error);
	}
}

export async function uploadFile(file: File, key: string, contentType: string): Promise<string> {
	const arrayBuffer = await file.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);

	const command = new PutObjectCommand({
		Bucket: S3_BUCKET,
		Key: key,
		Body: buffer,
		ContentType: contentType,
		ACL: 'public-read' // Ensure file is readable
	});

	await s3.send(command);

	// Construct public URL
	// For local MinIO, it's typically http://localhost:9000/bucket-name/key
	// In production (AWS), it's https://bucket.s3.region.amazonaws.com/key
	if (S3_ENDPOINT.includes('localhost') || S3_ENDPOINT.includes('minio')) {
		const url = new URL(`${S3_ENDPOINT}/${S3_BUCKET}/${key}`);
		if (url.hostname === 'minio') {
			url.hostname = 'localhost';
		}
		return url.toString();
	}

	return `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`;
}

export async function uploadBuffer(buffer: Buffer, key: string, contentType: string): Promise<string> {
	const command = new PutObjectCommand({
		Bucket: S3_BUCKET,
		Key: key,
		Body: buffer,
		ContentType: contentType,
		ACL: 'public-read'
	});

	await s3.send(command);

	if (S3_ENDPOINT.includes('localhost') || S3_ENDPOINT.includes('minio')) {
		const url = new URL(`${S3_ENDPOINT}/${S3_BUCKET}/${key}`);
		if (url.hostname === 'minio') {
			url.hostname = 'localhost';
		}
		return url.toString();
	}

	return `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`;
}
