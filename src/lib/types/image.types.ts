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
	REMOVE_BG = 'remove_bg'
}

// [NEW] Interface untuk opsi Resize
export interface IResizeOptions {
	width?: number;
	height?: number;
	fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

// [NEW] Interface untuk opsi Watermark
export interface IWatermarkOptions {
	file?: File;
	text?: string; // Opsional: Text watermark (nanti bisa diexpand)
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
}

export interface IProcessImageOutput {
	fileName: string;
	publicUrl: string;
	downloadUrl: string;
	originalSize: number;
	newSize: number;
	format: string;
}

export interface ProcessSuccess {
	url: string;
	downloadUrl: string;
	originalSize: number;
	newSize: number;
	format: string;
	stats: string;
}
