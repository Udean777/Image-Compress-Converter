export enum ImageFormat {
	PNG = 'png',
	JPEG = 'jpeg',
	JPG = 'jpg',
	WEBP = 'webp',
	AVIF = 'avif',
	GIF = 'gif'
}

export enum ProcessType {
	COMPRESS = 'compress',
	CONVERT = 'convert'
}

export interface IProcessImageInput {
	file: File;
	type: ProcessType;
	targetFormat?: ImageFormat;
	userId: string;
}

export interface IProcessImageOutput {
	fileName: string;
	publicUrl: string;
	downloadUrl: string;
	originalSize: number;
	newSize: number;
	format: string;
}
