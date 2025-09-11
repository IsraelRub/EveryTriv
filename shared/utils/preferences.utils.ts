/**
 * User Preferences Utilities
 * 
 * @module PreferencesUtils
 * @description Centralized utilities for user preferences management
 */

import { ServerUserPreferences, UserPreferences, PreferenceValue } from '../types/domain/user/user.types';

/**
 * Default user preferences
 * @description Centralized default preferences used across the application
 */
export const DEFAULT_USER_PREFERENCES: ServerUserPreferences = {
	theme: 'auto',
	language: 'en',
	timezone: 'UTC',
	emailNotifications: true,
	pushNotifications: true,
	soundEnabled: true,
	musicEnabled: true,
	animationsEnabled: true,
	autoSaveEnabled: true,
	privacy: {
		profileVisibility: 'public',
		showOnlineStatus: true,
		showActivity: true,
		showAchievements: true
	},
	game: {
		timeLimit: 30,
		questionLimit: 10
	}
};

/**
 * Merge user preferences with defaults
 * @param userPreferences Partial user preferences from API
 * @returns Complete preferences with defaults filled in
 */
export function mergeWithDefaults(userPreferences: UserPreferences | Partial<ServerUserPreferences> | null | undefined): ServerUserPreferences {
	if (!userPreferences) {
		return DEFAULT_USER_PREFERENCES;
	}

	return {
		theme: userPreferences.theme || DEFAULT_USER_PREFERENCES.theme,
		language: userPreferences.language || DEFAULT_USER_PREFERENCES.language,
		timezone: userPreferences.timezone || DEFAULT_USER_PREFERENCES.timezone,
		emailNotifications: userPreferences.emailNotifications ?? DEFAULT_USER_PREFERENCES.emailNotifications,
		pushNotifications: userPreferences.pushNotifications ?? DEFAULT_USER_PREFERENCES.pushNotifications,
		soundEnabled: userPreferences.soundEnabled ?? DEFAULT_USER_PREFERENCES.soundEnabled,
		musicEnabled: userPreferences.musicEnabled ?? DEFAULT_USER_PREFERENCES.musicEnabled,
		animationsEnabled: userPreferences.animationsEnabled ?? DEFAULT_USER_PREFERENCES.animationsEnabled,
		autoSaveEnabled: userPreferences.autoSaveEnabled ?? DEFAULT_USER_PREFERENCES.autoSaveEnabled,
		privacy: {
			profileVisibility: userPreferences.privacy?.profileVisibility || DEFAULT_USER_PREFERENCES.privacy.profileVisibility,
			showOnlineStatus: userPreferences.privacy?.showOnlineStatus ?? DEFAULT_USER_PREFERENCES.privacy.showOnlineStatus,
			showActivity: userPreferences.privacy?.showActivity ?? DEFAULT_USER_PREFERENCES.privacy.showActivity,
			showAchievements: userPreferences.privacy?.showAchievements ?? DEFAULT_USER_PREFERENCES.privacy.showAchievements
		},
		game: {
			timeLimit: userPreferences.game?.timeLimit || DEFAULT_USER_PREFERENCES.game.timeLimit,
			questionLimit: userPreferences.game?.questionLimit || DEFAULT_USER_PREFERENCES.game.questionLimit
		}
	};
}

/**
 * Update nested preference (e.g., privacy.showOnlineStatus)
 * @param preferences Current preferences
 * @param path Dot-separated path to the nested property
 * @param value New value
 * @returns Updated preferences
 */
export function updateNestedPreference(
	preferences: ServerUserPreferences,
	path: string,
	value: PreferenceValue
): ServerUserPreferences {
	const keys = path.split('.');
	const result = { ...preferences };
	
	// Type-safe nested property update
	if (keys.length === 1) {
		// Direct property update
		const key = keys[0] as keyof ServerUserPreferences;
		if (key in result) {
			(result as ServerUserPreferences)[key] = value as never;
		}
	} else if (keys.length === 2) {
		// Nested property update (e.g., privacy.showOnlineStatus)
		const [parentKey, childKey] = keys;
		if (parentKey === 'privacy' && result.privacy) {
			(result.privacy as Record<string, PreferenceValue>)[childKey] = value;
		} else if (parentKey === 'game' && result.game) {
			(result.game as Record<string, PreferenceValue>)[childKey] = value;
		}
	}
	
	return result;
}
