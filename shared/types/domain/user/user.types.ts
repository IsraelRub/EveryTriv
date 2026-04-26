// User-related types for EveryTriv.
import type { Locale } from '@shared/constants';

import { AuthProvider, DifficultyLevel, GameMode, UserRole, UserStatus } from '../../../constants';
import type { BaseEntity } from '../../core/data.types';
import type { BaseGameStatistics } from '../game/game.types';

export interface BasicUser {
	id: string;
	email: string;
	role: UserRole;
	firstName?: string;
	lastName?: string;
	avatar?: number;

	avatarUrl?: string;

	needsLegalAcceptance?: boolean;
}

export interface UserProfile extends BasicUser, BaseEntity {
	preferences?: Partial<UserPreferences>;
}

export interface UserPrivacyPreferences {
	showOnlineStatus?: boolean;
	showActivity?: boolean;
}

export interface UserGamePreferences {
	defaultDifficulty: DifficultyLevel;

	defaultCustomDifficultyDescription?: string;
	defaultTopic?: string;
	defaultGameMode?: GameMode;
	timeLimit?: number;
	maxQuestionsPerGame?: number;
}

export interface UserPreferences {
	emailNotifications: boolean;
	pushNotifications: boolean;
	soundEnabled: boolean;
	musicEnabled: boolean;
	animationsEnabled: boolean;
	avatar?: number;
	locale?: Locale;
	privacy: UserPrivacyPreferences;
	game: UserGamePreferences;
}

export type UserPreferencesPatch = Omit<Partial<UserPreferences>, 'game'> & {
	game?: Partial<UserGamePreferences>;
};

export interface User extends UserProfile {
	status: UserStatus;
	lastLogin?: Date;
	authProvider: AuthProvider;
	credits: number;
	purchasedCredits: number;
	totalCredits: number;
}

export interface UserStatistics extends BaseGameStatistics {
	currentStreak: number;
	bestStreak: number;
	favoriteTopic: string;
	lastPlayed: Date;
	accountAge: number;
}

export interface UpdateUserProfileData {
	firstName?: string;
	lastName?: string | null;
	avatar?: number;
	preferences?: Partial<UserPreferences>;
}

export interface ChangePasswordData {
	currentPassword: string;
	newPassword: string;
}
