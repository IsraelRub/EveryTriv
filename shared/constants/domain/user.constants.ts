import type { UserPreferences } from '../../types';
import { DEFAULT_GAME_CONFIG, GameMode } from './game.constants';

export enum UserRole {
	ADMIN = 'admin',
	GUEST = 'guest',
	USER = 'user',
	PREMIUM = 'premium',
}

export enum UserStatus {
	ACTIVE = 'active',
	INACTIVE = 'inactive',
	SUSPENDED = 'suspended',
	BANNED = 'banned',
	PENDING_VERIFICATION = 'pending_verification',
}

export const VALID_USER_STATUSES = Object.values(UserStatus);

export const VALID_USER_STATUSES_SET = new Set<string>(VALID_USER_STATUSES);

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
