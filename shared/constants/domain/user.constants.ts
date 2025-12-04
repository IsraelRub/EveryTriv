/**
 * User Constants for EveryTriv
 *
 * @module UserConstants
 * @description User-related enums and constants shared between client and server
 * @used_by server/src/features/user, client/src/components/user, shared/types
 */

import type { UserPreferences } from '../../types';
import { DifficultyLevel, GameMode } from './game.constants';

/**
 * User roles enumeration
 * @enum {string} UserRole
 * @description Available user roles in the system
 * @used_by server/src/features/user/user.service.ts, server/src/features/auth/auth.service.ts
 */
export enum UserRole {
	ADMIN = 'admin',
	GUEST = 'guest',
	USER = 'user',
	PREMIUM = 'premium',
}

/**
 * User status enumeration
 * @enum {string} UserStatus
 * @description Available user statuses in the system
 * @used_by server/src/features/user/user.service.ts, server/src/features/auth/auth.service.ts
 */
export enum UserStatus {
	ACTIVE = 'active',
	INACTIVE = 'inactive',
	SUSPENDED = 'suspended',
	BANNED = 'banned',
	PENDING_VERIFICATION = 'pending_verification',
}

/**
 * Default user preferences
 * @constant
 * @description Default user preferences shared between client and server
 * @used_by client/src/utils/user.utils.ts, server/src/features/user/user.service.ts
 */
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
	// Required base fields
	emailNotifications: true,
	pushNotifications: true,
	soundEnabled: true,
	musicEnabled: true,
	animationsEnabled: true,
	privacy: {
		profileVisibility: 'private',
		showOnlineStatus: true,
		showActivity: true,
		showAchievements: true,
	},
	game: {
		defaultDifficulty: DifficultyLevel.MEDIUM,
		defaultTopic: 'general',
		defaultGameMode: GameMode.QUESTION_LIMITED,
		timeLimit: 30,
		maxQuestionsPerGame: 10,
	},
};

/**
 * Legacy password fallbacks for backward compatibility scenarios
 * Maps current hashed password defaults to the legacy password users might enter
 */
export const LEGACY_PASSWORD_FALLBACKS: Record<string, string> = {
	'AdminPass123!': 'OldPass123!',
};
