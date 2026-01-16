import { DEFAULT_USER_PREFERENCES } from '@shared/constants';
import type { UserPreferences } from '@shared/types';

export function mergeUserPreferences(
	basePreferences: Partial<UserPreferences> | null | undefined,
	newPreferences: Partial<UserPreferences> | null | undefined
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
