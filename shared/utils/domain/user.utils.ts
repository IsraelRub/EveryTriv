import {
	DEFAULT_GAME_CONFIG,
	DEFAULT_USER_PREFERENCES,
	DifficultyLevel,
	EMPTY_VALUE,
	ERROR_MESSAGES,
} from '@shared/constants';
import type { GameDifficulty, UserGamePreferences, UserPreferences, UserPreferencesPatch } from '@shared/types';
import { createCustomDifficulty, isRegisteredDifficulty, VALIDATORS } from '@shared/validation';

import { isNonEmptyString } from '../core/data.utils';

function normalizeUserGamePreferencesAfterMerge(game: UserGamePreferences): UserGamePreferences {
	if (game.defaultDifficulty !== DifficultyLevel.CUSTOM) {
		const { defaultCustomDifficultyDescription: _removed, ...rest } = game;
		return rest;
	}
	return game;
}

export function buildGameDifficultyFromUserGamePreferences(
	game: Pick<UserGamePreferences, 'defaultDifficulty' | 'defaultCustomDifficultyDescription'>
): GameDifficulty {
	const raw = game.defaultDifficulty;
	if (!VALIDATORS.string(raw) || !isRegisteredDifficulty(raw)) {
		return DEFAULT_GAME_CONFIG.defaultDifficulty;
	}
	if (raw !== DifficultyLevel.CUSTOM) {
		return raw;
	}
	const text = game.defaultCustomDifficultyDescription?.trim() ?? '';
	if (text.length === 0) {
		throw new Error(ERROR_MESSAGES.validation.CUSTOM_DIFFICULTY_REQUIRES_DESCRIPTION);
	}
	return createCustomDifficulty(text);
}

export function mergeUserPreferences(
	basePreferences: Partial<UserPreferences> | null | undefined,
	newPreferences: UserPreferencesPatch | null | undefined
): UserPreferences {
	const base = basePreferences ?? DEFAULT_USER_PREFERENCES;
	if (!newPreferences) {
		// Return base with defaults filled in for missing fields
		const { privacy, game, ...restBase } = base;
		const mergedGame = game ?? DEFAULT_USER_PREFERENCES.game;
		return {
			...DEFAULT_USER_PREFERENCES,
			...restBase,
			privacy: privacy ?? DEFAULT_USER_PREFERENCES.privacy,
			game: normalizeUserGamePreferencesAfterMerge(mergedGame),
		};
	}

	// Extract privacy and game to avoid shallow merge issues
	const { privacy, game, ...restNewPreferences } = newPreferences;

	const mergedGame = game
		? {
				...(base.game ?? DEFAULT_USER_PREFERENCES.game),
				...game,
			}
		: (base.game ?? DEFAULT_USER_PREFERENCES.game);

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
		game: normalizeUserGamePreferencesAfterMerge(mergedGame),
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
