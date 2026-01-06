export const IMAGE_ACTIONS = [
	{ value: 'compress', label: '🗜️ Compress Only' },
	{ value: 'convert', label: '🔄 Convert Format' }
] as const;

export const IMAGE_FORMATS = [
	{ value: 'jpg', label: 'JPG' },
	{ value: 'png', label: 'PNG' },
	{ value: 'webp', label: 'WEBP' }
] as const;

export type ImageAction = (typeof IMAGE_ACTIONS)[number]['value'];
export type ImageFormat = (typeof IMAGE_FORMATS)[number]['value'];
