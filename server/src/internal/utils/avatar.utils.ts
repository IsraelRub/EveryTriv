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

function tryAvatarVersionTimestamp(updatedAt: Date | string | null | undefined): number | undefined {
	if (updatedAt == null) return undefined;
	if (updatedAt instanceof Date && !Number.isNaN(updatedAt.getTime())) {
		return updatedAt.getTime();
	}
	if (typeof updatedAt === 'string') {
		const parsed = new Date(updatedAt);
		if (!Number.isNaN(parsed.getTime())) {
			return parsed.getTime();
		}
	}
	return undefined;
}

export function getCustomAvatarUrlForUserId(userId: string, updatedAt: Date | string | null | undefined): string {
	const basePath = API_ENDPOINTS.USER.AVATAR_IMAGE.replace(':userId', userId);
	const version = tryAvatarVersionTimestamp(updatedAt) ?? Date.now();
	return `${basePath}?v=${version}`;
}

export function getAvatarUrlForUser(
	user:
		| {
				id?: string;
				customAvatar?: unknown;
				customAvatarMime?: string | null;
				updatedAt?: Date | string | null;
		  }
		| null
		| undefined
): string | undefined {
	const hasAvatarData =
		(Buffer.isBuffer(user?.customAvatar) && user.customAvatar.length > 0) ||
		(user?.customAvatar instanceof Uint8Array && user.customAvatar.length > 0);
	const hasAvatarMime = typeof user?.customAvatarMime === 'string' && user.customAvatarMime.trim() !== '';
	if (!user?.id || (!hasAvatarData && !hasAvatarMime)) return undefined;
	const basePath = API_ENDPOINTS.USER.AVATAR_IMAGE.replace(':userId', user.id);
	if (user.updatedAt == null) {
		return basePath;
	}
	const version = tryAvatarVersionTimestamp(user.updatedAt);
	if (version === undefined) {
		return basePath;
	}
	return `${basePath}?v=${version}`;
}
