import { VALIDATION_COUNT } from '@shared/constants';

/**
 * Check if avatar ID is valid
 * @param id Avatar ID to validate
 * @returns True if valid (1-16), false otherwise
 */
export const isValidAvatarId = (id: number): boolean => {
	const { MIN, MAX } = VALIDATION_COUNT.AVATAR_ID;
	return Number.isInteger(id) && id >= MIN && id <= MAX;
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
