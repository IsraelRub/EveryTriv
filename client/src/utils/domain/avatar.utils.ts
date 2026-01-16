import { VALIDATION_COUNT } from '@shared/constants';

export const isValidAvatarId = (id: number): boolean => {
	const { MIN, MAX } = VALIDATION_COUNT.AVATAR_ID;
	return Number.isInteger(id) && id >= MIN && id <= MAX;
};

export const getAvatarUrl = (avatarId: number | null | undefined): string | undefined => {
	if (!avatarId) return undefined;
	if (!isValidAvatarId(avatarId)) return undefined;
	return `/assets/avatars/${avatarId}.png`;
};
