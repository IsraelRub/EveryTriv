import type { BasicUser, UserProfileResponseType } from '@shared/types';

import { DISPLAY_NAME_FALLBACKS } from '@/constants';

const defaultPlayerFallback: string = DISPLAY_NAME_FALLBACKS.PLAYER;

export function getDisplayNameFromUser(source: {
	firstName?: string | null;
	lastName?: string | null;
	email?: string | null;
}): string {
	if (source.firstName && source.lastName) return `${source.firstName} ${source.lastName}`.trim();
	if (source.firstName) return source.firstName.trim();
	if (source.email) return source.email;
	return '';
}

export function getDisplayNameFromPlayer(
	source: { displayName?: string | null },
	fallback: string = defaultPlayerFallback
): string {
	const trimmed = source.displayName?.trim();
	return trimmed !== undefined && trimmed !== '' ? trimmed : fallback;
}

export function profileResponseToBasicUser(profileResponse: UserProfileResponseType): BasicUser {
	const p = profileResponse.profile;
	return {
		id: p.id,
		email: p.email,
		role: p.role,
		firstName: p.firstName,
		lastName: p.lastName,
		avatar: p.avatar,
	};
}
