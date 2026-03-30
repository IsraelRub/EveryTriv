import { VALIDATION_COUNT } from '@shared/constants';


export const isAvatarIdOrClear = (id: number): boolean => id === 0 || isValidAvatarId(id);

export const getAvatarUrl = (avatarId: number | null | undefined): string | undefined => {
	if (!avatarId) return undefined;
	if (!isValidAvatarId(avatarId)) return undefined;
	return `/assets/avatars/${avatarId}.png`;
};

export const getAvatarImageSource = (avatarUrl?: string | null, avatarId?: number | null): string | undefined => {
	if (avatarUrl != null && avatarUrl !== '') return avatarUrl;
	return getAvatarUrl(avatarId);
};

export function toAbsoluteAvatarUrl(url: string | null | undefined, apiBaseUrl: string): string | undefined {
	if (url == null || url === '') return undefined;
	if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) return url;
	if (url.startsWith('/assets/')) return url;
	const base = apiBaseUrl.replace(/\/$/, '');
	return url.startsWith('/') ? base + url : `${base}/${url}`;
}
const isValidAvatarId = (id: number): boolean => {
	const { MIN, MAX } = VALIDATION_COUNT.AVATAR_ID;
	return Number.isInteger(id) && id >= MIN && id <= MAX;
};

