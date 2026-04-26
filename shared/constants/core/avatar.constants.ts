import { MEBIBYTE } from './binarySize.constants';

export const AVATAR_UPLOAD_MAX_BYTES = 2 * MEBIBYTE;

export const AVATAR_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export const AVATAR_ALLOWED_MIME_TYPES_SET = new Set<string>(AVATAR_ALLOWED_MIME_TYPES);
