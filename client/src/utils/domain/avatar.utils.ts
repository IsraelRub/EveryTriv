import { AVATAR_CONFIG } from '@/constants';

/**
 * Check if avatar ID is valid
 * @param id Avatar ID to validate
 * @returns True if valid (1-16), false otherwise
 */
export const isValidAvatarId = (id: number): boolean => {
	return Number.isInteger(id) && id >= AVATAR_CONFIG.MIN_AVATAR_ID && id <= AVATAR_CONFIG.MAX_AVATAR_ID;
};

/**
 * Get avatar URL by ID (generated dynamically)
 * @param avatarId Avatar ID (number, null, or undefined)
 * @returns Avatar image URL or undefined if not found
 */
export const getAvatarUrl = (avatarId: number | null | undefined): string | undefined => {
	if (!avatarId) return undefined;
	if (!isValidAvatarId(avatarId)) return undefined;
	return `/assets/avatars/${avatarId}.png`;
};
