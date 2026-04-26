import type { UserPreferences } from '../../types';
import { DEFAULT_GAME_CONFIG, GameMode } from './game.constants';

export enum UserRole {
	ADMIN = 'admin',
	USER = 'user',
}

export const USER_ROLES = new Set<string>(Object.values(UserRole));

export enum UserStatus {
	ACTIVE = 'active',
	INACTIVE = 'inactive',
	SUSPENDED = 'suspended',
	BANNED = 'banned',
}

export const USER_STATUSES = new Set<string>(Object.values(UserStatus));

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
	},
	game: {
		...DEFAULT_GAME_CONFIG,
		defaultGameMode: GameMode.QUESTION_LIMITED,
	},
};
