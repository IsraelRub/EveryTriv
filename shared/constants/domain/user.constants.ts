/**
 * User Constants for EveryTriv
 *
 * @module UserConstants
 * @description User-related enums and constants shared between client and server
 * @used_by server/src/features/user, client/src/components/user, shared/types
 */

import type { UserPreferences } from '../../types';
import { DEFAULT_GAME_CONFIG, GameMode } from './game.constants';

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

export const VALID_USER_STATUSES = Object.values(UserStatus);

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
		showOnlineStatus: true,
		showActivity: true,
		showAchievements: true,
	},
	game: {
		...DEFAULT_GAME_CONFIG,
		defaultGameMode: GameMode.QUESTION_LIMITED,
	},
};
