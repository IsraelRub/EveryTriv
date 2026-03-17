import { DEFAULT_USER_PREFERENCES, EMPTY_VALUE } from '@shared/constants';
import type { UserPreferences, UserPreferencesPatch } from '@shared/types';

import { isNonEmptyString } from '../core/data.utils';

export function mergeUserPreferences(
	basePreferences: Partial<UserPreferences> | null | undefined,
	newPreferences: UserPreferencesPatch | null | undefined
): UserPreferences {
	const base = basePreferences ?? DEFAULT_USER_PREFERENCES;
	if (!newPreferences) {
		// Return base with defaults filled in for missing fields
		const { privacy, game, ...restBase } = base;
		return {
			...DEFAULT_USER_PREFERENCES,
			...restBase,
			privacy: privacy ?? DEFAULT_USER_PREFERENCES.privacy,
			game: game ?? DEFAULT_USER_PREFERENCES.game,
		};
	}

	// Extract privacy and game to avoid shallow merge issues
	const { privacy, game, ...restNewPreferences } = newPreferences;

	return {
		...DEFAULT_USER_PREFERENCES,
		...base,
		...restNewPreferences,
		privacy: privacy
			? {
					...(base.privacy ?? DEFAULT_USER_PREFERENCES.privacy),
					...privacy,
				}
			: (base.privacy ?? DEFAULT_USER_PREFERENCES.privacy),
		game: game
			? {
					...(base.game ?? DEFAULT_USER_PREFERENCES.game),
					...game,
				}
			: (base.game ?? DEFAULT_USER_PREFERENCES.game),
	};
}

export function getDisplayNameFromUserFields(
	source:
		| {
				firstName?: string | null;
				lastName?: string | null;
				email?: string | null;
		  }
		| null
		| undefined
): string {
	if (source == null) return EMPTY_VALUE;
	if (isNonEmptyString(source.firstName) && isNonEmptyString(source.lastName))
		return `${source.firstName} ${source.lastName}`.trim();
	if (isNonEmptyString(source.firstName)) return source.firstName.trim();
	if (isNonEmptyString(source.email)) return source.email.trim();
	return EMPTY_VALUE;
}
