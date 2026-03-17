import { API_ENDPOINTS } from '@shared/constants';

const JPEG_SIGNATURE = Buffer.from([0xff, 0xd8, 0xff]);
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const WEBP_RIFF = Buffer.from([0x52, 0x49, 0x46, 0x46]);
const WEBP_WEBP = Buffer.from([0x57, 0x45, 0x42, 0x50]);

function bufferStartsWith(buffer: Buffer, prefix: Buffer): boolean {
	if (buffer.length < prefix.length) return false;
	return buffer.subarray(0, prefix.length).equals(prefix);
}

export function validateAvatarImageSignature(buffer: Buffer, claimedMime: string): boolean {
	const mime = claimedMime.toLowerCase();
	if (buffer.length < 12) return false;
	if (mime === 'image/jpeg') return bufferStartsWith(buffer, JPEG_SIGNATURE);
	if (mime === 'image/png') return bufferStartsWith(buffer, PNG_SIGNATURE);
	if (mime === 'image/webp') {
		return bufferStartsWith(buffer, WEBP_RIFF) && bufferStartsWith(buffer.subarray(8, 12), WEBP_WEBP);
	}
	return false;
}

export function buildAvatarUrl(userId: string, apiPublicBaseUrl: string): string {
	const base = apiPublicBaseUrl?.replace(/\/$/, '') ?? '';
	const path = API_ENDPOINTS.USER.AVATAR_IMAGE(userId);
	return base ? `${base}${path}` : path;
}

export function getAvatarUrlForUser(
	user: { id: string; customAvatar?: Buffer | null } | null | undefined,
	apiPublicBaseUrl: string
): string | undefined {
	if (!user?.id || !user.customAvatar?.length) return undefined;
	return buildAvatarUrl(user.id, apiPublicBaseUrl);
}
