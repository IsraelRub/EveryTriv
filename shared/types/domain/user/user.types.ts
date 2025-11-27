/**
 * User-related types for EveryTriv
 *
 * @module UserTypes
 * @description Type definitions for user entities, authentication, and user management
 */
import { DifficultyLevel, GameMode, UserRole, UserStatus } from '../../../constants';
import type { BaseEntity } from '../../core/data.types';
import type { BaseGameStatistics } from '../game/game.types';

/**
 * Basic User interface (minimal - identity only)
 * @interface BasicUser
 * @description Basic user information for authentication and minimal user data
 * @used_by client/src/types/redux/state.types.ts, shared/types/infrastructure/auth.types.ts, shared/types/infrastructure/api.types.ts
 */
export interface BasicUser {
	id: string;
	email: string;
	role: UserRole;
}

/**
 * User profile interface for API responses
 * @interface UserProfile
 * @description User profile data returned in API responses - identity + profile fields + timestamps
 * @used_by shared/types/domain/user/userOperations.types.ts (UserProfileResponseType)
 */
export interface UserProfile extends BasicUser, BaseEntity {
	firstName?: string;
	lastName?: string;
	avatar?: string;
	preferences?: Partial<UserPreferences>;
}

/**
 * User privacy preferences interface
 * @interface UserPrivacyPreferences
 * @description User privacy settings
 */
export interface UserPrivacyPreferences {
	profileVisibility?: 'public' | 'private' | 'friends';
	showOnlineStatus?: boolean;
	showActivity?: boolean;
	showAchievements?: boolean;
}

/**
 * User game preferences interface
 * @interface UserGamePreferences
 * @description User game settings
 */
export interface UserGamePreferences {
	defaultDifficulty: DifficultyLevel;
	defaultTopic?: string;
	defaultGameMode?: GameMode;
	timeLimit?: number;
	questionLimit?: number;
}

/**
 * User preferences interface
 * @interface UserPreferences
 * @description User preferences with required base fields
 */
export interface UserPreferences {
	emailNotifications: boolean;
	pushNotifications: boolean;
	soundEnabled: boolean;
	musicEnabled: boolean;
	animationsEnabled: boolean;
	privacy: UserPrivacyPreferences;
	game: UserGamePreferences;
}

/**
 * Authentication provider types
 */
export type AuthProvider = 'local' | 'google';

/**
 * User interface
 * @interface User
 * @description Complete user entity with all fields - extends UserProfile with system fields and additional data
 */
export interface User extends UserProfile {
	// System fields
	status: UserStatus;
	emailVerified: boolean;
	lastLogin?: Date;
	authProvider: AuthProvider;

	// Additional fields in use
	credits: number;
	purchasedCredits: number;
	totalCredits: number;
}

/**
 * User statistics interface
 * @interface UserStatistics
 * @description User statistics and performance data
 */
export interface UserStatistics extends BaseGameStatistics {
	currentStreak: number;
	bestStreak: number;
	favoriteTopic: string;
	lastPlayed: Date;
	accountAge: number;
}

/**
 * Update user profile data interface
 * @type UpdateUserProfileData
 * @description Data for updating user profile - all UserProfile fields except read-only ones (id, email, role, createdAt, updatedAt)
 * @used_by client/src/services/api.service.ts, server/src/features/user, client/src/views/settings/SettingsView.tsx
 */
export type UpdateUserProfileData = Partial<Omit<UserProfile, 'id' | 'email' | 'role' | 'createdAt' | 'updatedAt'>>;
