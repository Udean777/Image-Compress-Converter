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
	CONVERT = 'convert',
	REMOVE_BG = 'remove_bg',
	WATERMARK = 'watermark'
}

// [NEW] Interface untuk opsi Resize
export interface IResizeOptions {
	width?: number;
	height?: number;
	fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

export interface ICropOptions {
	x: number;
	y: number;
	width: number;
	height: number;
	filters?: {
		brightness?: number;
		contrast?: number;
		saturation?: number;
		grayscale?: number;
	};
	watermark?: {
		text: string;
		x: number;
		y: number;
	};
}

// [NEW] Interface untuk opsi Watermark
export interface IWatermarkOptions {
	file?: File;
	text?: string;
	textColor?: string;
	textSize?: number;
	opacity?: number;
	position?:
		| 'north'
		| 'northeast'
		| 'southeast'
		| 'south'
		| 'southwest'
		| 'west'
		| 'northwest'
		| 'east'
		| 'center';
}

export interface IProcessImageInput {
	file: File;
	type: ProcessType;
	targetFormat?: ImageFormat;
	userId: string;
	quality?: number;
	// [NEW] Tambahan opsi manipulasi
	resize?: IResizeOptions;
	watermark?: IWatermarkOptions;
	stripMetadata?: boolean;
	crop?: ICropOptions;
	generateAltText?: boolean;
	upscale?: boolean;
	smartCompression?: boolean;
}

export interface IProcessImageOutput {
	fileName: string;
	publicUrl: string;
	downloadUrl: string;
	originalSize: number;
	newSize: number;
	format: string;
	altText?: string;
}

export interface ProcessSuccess {
	url: string;
	downloadUrl: string;
	originalSize: number;
	newSize: number;
	format: string;
	stats: string;
}
