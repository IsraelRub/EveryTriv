/**
 * User-related types for EveryTriv
 *
 * @module UserTypes
 * @description Type definitions for user entities, authentication, and user management
 * @used_by server: server/src/features/user/entities/user.entity.ts (User entity), server/src/features/auth/auth.service.ts (authentication), client: client/src/components/user/UserProfile.tsx (user profile), client/src/services/auth/auth.service.ts (user authentication)
 */
import { UserRole, UserStatus } from '../../../constants/business/info.constants';
import type { BaseEntity, BasicValue } from '../../core/data.types';

// RequiredFields and OptionalFields are not used in this file

// Re-export enums for external use
export { UserRole, UserStatus };

/**
 * Primitive value types for user preferences
 * @type PreferenceValue
 * @description Union type for all possible preference values
 */
export type PreferenceValue = BasicValue;

/**
 * User profile update data interface
 * @interface UserProfileUpdateData
 * @description Data for updating user profile
 */
export interface UserProfileUpdateData {
	username?: string;
	email?: string;
	first_name?: string;
	last_name?: string;
	avatar?: string;
	bio?: string;
	website?: string;
	preferences?: UserPreferences;
	metadata?: Record<string, any>;
}

/**
 * User field update interface
 * @interface UserFieldUpdate
 * @description Data for updating specific user fields
 */
export interface UserFieldUpdate {
	username?: string;
	email?: string;
	role?: UserRole;
	status?: UserStatus;
	emailVerified?: boolean;
	lastLogin?: Date;
	authProvider?: AuthProvider;
	preferences?: UserPreferences;
	metadata?: Record<string, any>;
}

/**
 * User preferences interface
 * @interface UserPreferences
 * @description User preferences and settings
 */
export interface UserPreferences {
	theme?: 'light' | 'dark' | 'auto';
	language?: string;
	timezone?: string;
	emailNotifications?: boolean;
	pushNotifications?: boolean;
	soundEnabled?: boolean;
	musicEnabled?: boolean;
	animationsEnabled?: boolean;
	autoSaveEnabled?: boolean;
	privacy?: UserPrivacyPreferences;
	game?: UserGamePreferences;
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
	defaultDifficulty?: string;
	defaultTopic?: string;
	defaultGameMode?: string;
	timeLimit?: number;
	questionLimit?: number;
}

/**
 * Server user preferences interface
 * @interface ServerUserPreferences
 * @description Server-specific user preferences
 */
export interface ServerUserPreferences extends Record<string, unknown> {
	theme: 'light' | 'dark' | 'auto';
	language: string;
	timezone: string;
	emailNotifications: boolean;
	pushNotifications: boolean;
	soundEnabled: boolean;
	musicEnabled: boolean;
	animationsEnabled: boolean;
	autoSaveEnabled: boolean;
	privacy: {
		profileVisibility: 'public' | 'private' | 'friends';
		showOnlineStatus: boolean;
		showActivity: boolean;
		showAchievements: boolean;
	};
	game: {
		timeLimit: number;
		questionLimit: number;
	};
}

/**
 * Authentication provider types
 */
export type AuthProvider = 'local' | 'google' | 'facebook' | 'twitter' | 'github';

/**
 * Base user interface
 * @interface BaseUser
 * @description Base interface for user entities with common fields
 * @used_by server: server/src/features/user/entities/user.entity.ts (User entity), client: client/src/services/auth/auth.service.ts (user authentication)
 */
export interface BaseUser extends BaseEntity {
	username: string;
	email: string;
	role: UserRole;
	status: UserStatus;
	emailVerified: boolean;
	lastLogin?: Date;
	authProvider: AuthProvider;
}

/**
 * User interface
 * @interface User
 * @description Complete user entity with all fields
 * @used_by server: server/src/features/user/entities/user.entity.ts (User entity), client: client/src/components/user/UserProfile.tsx (user profile display)
 */
export interface User extends BaseUser {
	firstName?: string;
	lastName?: string;
	fullName?: string;
	bio?: string;
	website?: string;
	avatar?: string;
	dateOfBirth?: Date;
	country?: string;
	timezone?: string;
	language?: string;
	address?: UserAddress;
	credits: number;
	purchasedPoints: number;
	totalPoints: number;
	createdAt: Date;
	subscriptionStatus?: string;
	subscriptionExpiry?: Date;
	preferences?: UserPreferences;
	statistics?: UserStatistics;
	achievements?: UserAchievement[];
	badges?: UserBadge[];
	friends?: UserFriend[];
	notifications?: UserNotification[];
	settings?: UserSettings;
}

/**
 * User statistics interface
 * @interface UserStatistics
 * @description User statistics and performance data
 * @used_by client: client/src/views/leaderboard/Leaderboard.tsx (statistics display), client/src/hooks/api/useUserPreferences.ts (statistics handling)
 */
export interface UserStatistics {
	totalGames: number;
	totalQuestions: number;
	totalCorrectAnswers: number;
	successRate: number;
	averageScore: number;
	bestScore: number;
	totalPlayTime: number;
	currentStreak: number;
	bestStreak: number;
	favoriteTopic: string;
	favoriteDifficulty: string;
	lastPlayed: Date;
	accountAge: number;
	level: number;
	experiencePoints: number;
	nextLevelExperience: number;
}

/**
 * User achievement interface
 * @interface UserAchievement
 * @description User achievement data
 * @used_by client: client/src/components/user/UserProfile.tsx (achievements display), client/src/hooks/api/useUserPreferences.ts (achievements handling)
 */
export interface UserAchievement {
	id: string;
	name: string;
	description: string;
	icon: string;
	category: string;
	rarity: 'common' | 'rare' | 'epic' | 'legendary';
	points: number;
	unlockedAt: Date;
	progress: number;
	maxProgress: number;
	isUnlocked: boolean;
}

/**
 * User badge interface
 * @interface UserBadge
 * @description User badge data
 * @used_by client: client/src/components/user/UserProfile.tsx (badges display), client/src/hooks/api/useUserPreferences.ts (badges handling)
 */
export interface UserBadge {
	id: string;
	name: string;
	description: string;
	icon: string;
	color: string;
	category: string;
	rarity: 'common' | 'rare' | 'epic' | 'legendary';
	points: number;
	unlockedAt: Date;
	isEquipped: boolean;
}

/**
 * User friend interface
 * @interface UserFriend
 * @description User friend data
 * @used_by client: client/src/components/user/UserProfile.tsx (friends display), client/src/hooks/api/useUserPreferences.ts (friends handling)
 */
export interface UserFriend {
	id: string;
	username: string;
	avatar?: string;
	status: 'online' | 'offline' | 'away' | 'busy';
	level: number;
	score: number;
	addedAt: Date;
	lastSeen: Date;
	isOnline: boolean;
}

/**
 * User notification interface
 * @interface UserNotification
 * @description User notification data
 * @used_by client: client/src/components/user/UserProfile.tsx (notifications display), client/src/hooks/api/useUserPreferences.ts (notifications handling)
 */
export interface UserNotification {
	id: string;
	title: string;
	message: string;
	type: 'info' | 'success' | 'warning' | 'error';
	category: string;
	icon?: string;
	isRead: boolean;
	createdAt: Date;
	readAt?: Date;
	action?: {
		type: string;
		url?: string;
		data?: Record<string, unknown>;
	};
}

/**
 * User field update interface
 * @interface UserFieldUpdate
 * @description Fields that can be updated for a user
 * @used_by server: server/src/common/validation/validation.service.ts (validateAndSetBooleanField method)
 */
export interface UserFieldUpdate {
	username?: string;
	email?: string;
	firstName?: string;
	lastName?: string;
	bio?: string;
	website?: string;
	avatar?: string;
	dateOfBirth?: Date;
	country?: string;
	timezone?: string;
	language?: string;
	credits?: number;
	purchasedPoints?: number;
	totalPoints?: number;
	subscriptionStatus?: string;
	subscriptionExpiry?: Date;
	preferences?: UserPreferences;
	statistics?: UserStatistics;
	settings?: UserSettings;
}

/**
 * User address interface
 * @interface UserAddress
 * @description User's address information
 * @used_by server: server/src/features/user/user.service.ts (updateUserProfile method)
 */
export interface UserAddress {
	street?: string;
	city?: string;
	state?: string;
	postalCode?: string;
	country?: string;
	zipCode?: string;
	apartment?: string;
}

/**
 * User settings interface
 * @interface UserSettings
 * @description User settings and configuration
 * @used_by client: client/src/components/user/UserProfile.tsx (settings display), client/src/hooks/api/useUserPreferences.ts (settings handling)
 */
export interface UserSettings {
	account: {
		twoFactorAuth: boolean;
		loginNotifications: boolean;
		securityAlerts: boolean;
		dataExport: boolean;
		accountDeletion: boolean;
	};
	privacy: {
		profileVisibility: 'public' | 'private' | 'friends';
		showOnlineStatus: boolean;
		showActivity: boolean;
		showAchievements: boolean;
		showFriends: boolean;
		showStatistics: boolean;
	};
	notifications: {
		email: boolean;
		push: boolean;
		sms: boolean;
		game: boolean;
		social: boolean;
		system: boolean;
	};
	game: {
		defaultDifficulty: string;
		defaultTopic: string;
		defaultGameMode: string;
		timeLimit: number;
		questionLimit: number;
		soundEnabled: boolean;
		animationsEnabled: boolean;
		autoSaveEnabled: boolean;
	};
}

/**
 * Update user profile data interface
 * @interface UpdateUserProfileData
 * @description Data for updating user profile
 * @used_by server: server/src/features/user/user.service.ts (updateUserProfile method)
 */
export interface UpdateUserProfileData {
	username?: string;
	email?: string;
	firstName?: string;
	lastName?: string;
	bio?: string;
	website?: string;
	avatar?: string;
	dateOfBirth?: Date;
	country?: string;
	timezone?: string;
	language?: string;
	preferences?: UserPreferences;
	address?: UserAddress;
	additional_info?: string;
}

/**
 * User profile interface
 * @interface UserProfile
 * @description User profile data
 * @used_by server: server/src/features/user/user.service.ts (getUserProfile method)
 */
export interface UserProfile {
	userId: string;
	username: string;
	email: string;
	firstName?: string;
	lastName?: string;
	bio?: string;
	website?: string;
	avatar?: string;
	dateOfBirth?: Date;
	country?: string;
	timezone?: string;
	language?: string;
	preferences?: UserPreferences;
	address?: UserAddress;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * User stats interface
 * @interface UserStats
 * @description User statistics
 * @used_by server: server/src/features/user/user.service.ts (getUserStats method)
 */
export interface UserStats {
	userId: string;
	totalGames: number;
	totalQuestions: number;
	totalCorrectAnswers: number;
	successRate: number;
	averageScore: number;
	bestScore: number;
	totalPlayTime: number;
	currentStreak: number;
	bestStreak: number;
	favoriteTopic: string;
	lastPlayed: Date;
}

/**
 * Server user preferences interface
 * @interface ServerUserPreferences
 * @description Server-side user preferences
 * @used_by server: server/src/features/user/entities/user.entity.ts (User entity)
 */
export interface ServerUserPreferences {
	theme: 'light' | 'dark' | 'auto';
	language: string;
	timezone: string;
	emailNotifications: boolean;
	pushNotifications: boolean;
	soundEnabled: boolean;
	musicEnabled: boolean;
	animationsEnabled: boolean;
	autoSaveEnabled: boolean;
	privacy: {
		profileVisibility: 'public' | 'private' | 'friends';
		showOnlineStatus: boolean;
		showActivity: boolean;
		showAchievements: boolean;
	};
	game: {
		timeLimit: number;
		questionLimit: number;
	};
}

/**
 * Normalize text function
 * @function normalizeText
 * @description Normalize text for processing
 * @used_by server: server/src/features/user/user.service.ts
 */

// Repository Query Types
export interface RepositoryWhereCondition extends Record<string, BasicValue | { $like: string } | { $in: string[] }> {}

export interface RepositoryUpdateData extends Record<string, BasicValue | Date | null | undefined> {}

// TypeORM Query Types
export interface UserTypeORMWhereCondition
	extends Record<
		string,
		BasicValue | { $like: string } | { $in: string[] } | Array<Record<string, BasicValue | { $like: string }>>
	> {}

// User with Subscription
export interface UserWithSubscription extends User {
	subscription?: {
		type: string;
		status: string;
		expiresAt?: string;
	};
}
