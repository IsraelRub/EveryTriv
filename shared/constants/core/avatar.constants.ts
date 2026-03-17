export const AVATAR_UPLOAD_MAX_BYTES = 2 * 1024 * 1024;

export const AVATAR_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export type AvatarAllowedMimeType = (typeof AVATAR_ALLOWED_MIME_TYPES)[number];

export const AVATAR_ALLOWED_MIME_TYPES_SET = new Set<string>(AVATAR_ALLOWED_MIME_TYPES);
