/**
 * User-related types for EveryTriv
 *
 * @module UserTypes
 * @description Type definitions for user entities, authentication, and user management
 * @used_by server: server/src/features/user/entities/user.entity.ts (User entity), server/src/features/auth/auth.service.ts (authentication), client: client/src/components/user/UserProfile.tsx (user profile), client/src/services/auth/auth.service.ts (user authentication)
 */
import type { BaseEntity, BasicValue } from '../../core/data.types';
import { UserRole, UserStatus } from '../../../constants/business/info.constants';
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
	/** Username */
	username?: string;
	/** Email address */
	email?: string;
	/** First name */
	first_name?: string;
	/** Last name */
	last_name?: string;
	/** Avatar URL */
	avatar?: string;
	/** Bio */
	bio?: string;
	/** Website */
	website?: string;
	/** User preferences */
	preferences?: UserPreferences;
	/** User metadata */
	metadata?: Record<string, any>;
}

/**
 * User field update interface
 * @interface UserFieldUpdate
 * @description Data for updating specific user fields
 */
export interface UserFieldUpdate {
	/** Username */
	username?: string;
	/** Email address */
	email?: string;
	/** User role */
	role?: UserRole;
	/** User status */
	status?: UserStatus;
	/** Whether email is verified */
	emailVerified?: boolean;
	/** Last login date */
	lastLogin?: Date;
	/** Authentication provider */
	authProvider?: AuthProvider;
	/** User preferences */
	preferences?: UserPreferences;
	/** User metadata */
	metadata?: Record<string, any>;
}

/**
 * User preferences interface
 * @interface UserPreferences
 * @description User preferences and settings
 */
export interface UserPreferences {
	/** Theme preference */
	theme?: 'light' | 'dark' | 'auto';
	/** Language preference */
	language?: string;
	/** Timezone */
	timezone?: string;
	/** Email notifications */
	emailNotifications?: boolean;
	/** Push notifications */
	pushNotifications?: boolean;
	/** Sound enabled */
	soundEnabled?: boolean;
	/** Music enabled */
	musicEnabled?: boolean;
	/** Animations enabled */
	animationsEnabled?: boolean;
	/** Auto save enabled */
	autoSaveEnabled?: boolean;
	/** Privacy settings */
	privacy?: UserPrivacyPreferences;
	/** Game settings */
	game?: UserGamePreferences;
}

/**
 * User privacy preferences interface
 * @interface UserPrivacyPreferences
 * @description User privacy settings
 */
export interface UserPrivacyPreferences {
	/** Profile visibility */
	profileVisibility?: 'public' | 'private' | 'friends';
	/** Show online status */
	showOnlineStatus?: boolean;
	/** Show activity */
	showActivity?: boolean;
	/** Show achievements */
	showAchievements?: boolean;
}

/**
 * User game preferences interface
 * @interface UserGamePreferences
 * @description User game settings
 */
export interface UserGamePreferences {
	/** Default difficulty */
	defaultDifficulty?: string;
	/** Default topic */
	defaultTopic?: string;
	/** Default game mode */
	defaultGameMode?: string;
	/** Time limit */
	timeLimit?: number;
	/** Question limit */
	questionLimit?: number;
}

/**
 * Server user preferences interface
 * @interface ServerUserPreferences
 * @description Server-specific user preferences
 */
export interface ServerUserPreferences extends Record<string, unknown> {
	/** Theme preference */
	theme: 'light' | 'dark' | 'auto';
	/** Language preference */
	language: string;
	/** Timezone */
	timezone: string;
	/** Email notifications */
	emailNotifications: boolean;
	/** Push notifications */
	pushNotifications: boolean;
	/** Sound enabled */
	soundEnabled: boolean;
	/** Music enabled */
	musicEnabled: boolean;
	/** Animations enabled */
	animationsEnabled: boolean;
	/** Auto save enabled */
	autoSaveEnabled: boolean;
	/** Privacy settings */
	privacy: {
		/** Profile visibility */
		profileVisibility: 'public' | 'private' | 'friends';
		/** Show online status */
		showOnlineStatus: boolean;
		/** Show activity */
		showActivity: boolean;
		/** Show achievements */
		showAchievements: boolean;
	};
	/** Game settings */
	game: {
		/** Time limit */
		timeLimit: number;
		/** Question limit */
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
	/** Username */
	username: string;
	/** Email address */
	email: string;
	/** User role */
	role: UserRole;
	/** User status */
	status: UserStatus;
	/** Whether email is verified */
	emailVerified: boolean;
	/** Last login date */
	lastLogin?: Date;
	/** Authentication provider */
	authProvider: AuthProvider;
}

/**
 * User interface
 * @interface User
 * @description Complete user entity with all fields
 * @used_by server: server/src/features/user/entities/user.entity.ts (User entity), client: client/src/components/user/UserProfile.tsx (user profile display)
 */
export interface User extends BaseUser {
	/** First name */
	firstName?: string;
	/** Last name */
	lastName?: string;
	/** Full name */
	fullName?: string;
	/** Bio */
	bio?: string;
	/** Website */
	website?: string;
	/** Avatar URL */
	avatar?: string;
	/** Date of birth */
	dateOfBirth?: Date;
	/** Country */
	country?: string;
	/** Timezone */
	timezone?: string;
	/** Language preference */
	language?: string;
	/** User address */
	address?: UserAddress;
	/** Credits */
	credits: number;
	/** Purchased points */
	purchasedPoints: number;
	/** Total points */
	totalPoints: number;
	/** Created at */
	createdAt: Date;
	/** Subscription status */
	subscriptionStatus?: string;
	/** Subscription expiry */
	subscriptionExpiry?: Date;
	/** User preferences */
	preferences?: UserPreferences;
	/** User statistics */
	statistics?: UserStatistics;
	/** User achievements */
	achievements?: UserAchievement[];
	/** User badges */
	badges?: UserBadge[];
	/** User friends */
	friends?: UserFriend[];
	/** User notifications */
	notifications?: UserNotification[];
	/** User settings */
	settings?: UserSettings;
}


/**
 * User statistics interface
 * @interface UserStatistics
 * @description User statistics and performance data
 * @used_by client: client/src/views/leaderboard/Leaderboard.tsx (statistics display), client/src/hooks/api/useUserPreferences.ts (statistics handling)
 */
export interface UserStatistics {
	/** Total games played */
	totalGames: number;
	/** Total questions answered */
	totalQuestions: number;
	/** Total correct answers */
	totalCorrectAnswers: number;
	/** Success rate */
	successRate: number;
	/** Average score */
	averageScore: number;
	/** Best score */
	bestScore: number;
	/** Total play time */
	totalPlayTime: number;
	/** Current streak */
	currentStreak: number;
	/** Best streak */
	bestStreak: number;
	/** Favorite topic */
	favoriteTopic: string;
	/** Favorite difficulty */
	favoriteDifficulty: string;
	/** Last played */
	lastPlayed: Date;
	/** Account age */
	accountAge: number;
	/** Level */
	level: number;
	/** Experience points */
	experiencePoints: number;
	/** Next level experience */
	nextLevelExperience: number;
}

/**
 * User achievement interface
 * @interface UserAchievement
 * @description User achievement data
 * @used_by client: client/src/components/user/UserProfile.tsx (achievements display), client/src/hooks/api/useUserPreferences.ts (achievements handling)
 */
export interface UserAchievement {
	/** Achievement ID */
	id: string;
	/** Achievement name */
	name: string;
	/** Achievement description */
	description: string;
	/** Achievement icon */
	icon: string;
	/** Achievement category */
	category: string;
	/** Achievement rarity */
	rarity: 'common' | 'rare' | 'epic' | 'legendary';
	/** Achievement points */
	points: number;
	/** Achievement unlocked date */
	unlockedAt: Date;
	/** Achievement progress */
	progress: number;
	/** Achievement max progress */
	maxProgress: number;
	/** Whether achievement is unlocked */
	isUnlocked: boolean;
}

/**
 * User badge interface
 * @interface UserBadge
 * @description User badge data
 * @used_by client: client/src/components/user/UserProfile.tsx (badges display), client/src/hooks/api/useUserPreferences.ts (badges handling)
 */
export interface UserBadge {
	/** Badge ID */
	id: string;
	/** Badge name */
	name: string;
	/** Badge description */
	description: string;
	/** Badge icon */
	icon: string;
	/** Badge color */
	color: string;
	/** Badge category */
	category: string;
	/** Badge rarity */
	rarity: 'common' | 'rare' | 'epic' | 'legendary';
	/** Badge points */
	points: number;
	/** Badge unlocked date */
	unlockedAt: Date;
	/** Whether badge is equipped */
	isEquipped: boolean;
}

/**
 * User friend interface
 * @interface UserFriend
 * @description User friend data
 * @used_by client: client/src/components/user/UserProfile.tsx (friends display), client/src/hooks/api/useUserPreferences.ts (friends handling)
 */
export interface UserFriend {
	/** Friend ID */
	id: string;
	/** Friend username */
	username: string;
	/** Friend avatar */
	avatar?: string;
	/** Friend status */
	status: 'online' | 'offline' | 'away' | 'busy';
	/** Friend level */
	level: number;
	/** Friend score */
	score: number;
	/** Friend added date */
	addedAt: Date;
	/** Friend last seen */
	lastSeen: Date;
	/** Whether friend is online */
	isOnline: boolean;
}

/**
 * User notification interface
 * @interface UserNotification
 * @description User notification data
 * @used_by client: client/src/components/user/UserProfile.tsx (notifications display), client/src/hooks/api/useUserPreferences.ts (notifications handling)
 */
export interface UserNotification {
	/** Notification ID */
	id: string;
	/** Notification title */
	title: string;
	/** Notification message */
	message: string;
	/** Notification type */
	type: 'info' | 'success' | 'warning' | 'error';
	/** Notification category */
	category: string;
	/** Notification icon */
	icon?: string;
	/** Notification read status */
	isRead: boolean;
	/** Notification created date */
	createdAt: Date;
	/** Notification read date */
	readAt?: Date;
	/** Notification action */
	action?: {
		/** Action type */
		type: string;
		/** Action URL */
		url?: string;
		/** Action data */
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
	/** Username */
	username?: string;
	/** Email address */
	email?: string;
	/** First name */
	firstName?: string;
	/** Last name */
	lastName?: string;
	/** Bio */
	bio?: string;
	/** Website */
	website?: string;
	/** Avatar URL */
	avatar?: string;
	/** Date of birth */
	dateOfBirth?: Date;
	/** Country */
	country?: string;
	/** Timezone */
	timezone?: string;
	/** Language preference */
	language?: string;
	/** Credits */
	credits?: number;
	/** Purchased points */
	purchasedPoints?: number;
	/** Total points */
	totalPoints?: number;
	/** Subscription status */
	subscriptionStatus?: string;
	/** Subscription expiry */
	subscriptionExpiry?: Date;
	/** User preferences */
	preferences?: UserPreferences;
	/** User statistics */
	statistics?: UserStatistics;
	/** User settings */
	settings?: UserSettings;
}

/**
 * User address interface
 * @interface UserAddress
 * @description User's address information
 * @used_by server: server/src/features/user/user.service.ts (updateUserProfile method)
 */
export interface UserAddress {
	/** Street address */
	street?: string;
	/** City */
	city?: string;
	/** State/Province */
	state?: string;
	/** Postal code */
	postalCode?: string;
	/** Country */
	country?: string;
	/** ZIP code */
	zipCode?: string;
	/** Apartment */
	apartment?: string;
}

/**
 * User settings interface
 * @interface UserSettings
 * @description User settings and configuration
 * @used_by client: client/src/components/user/UserProfile.tsx (settings display), client/src/hooks/api/useUserPreferences.ts (settings handling)
 */
export interface UserSettings {
	/** Account settings */
	account: {
		/** Two-factor authentication */
		twoFactorAuth: boolean;
		/** Login notifications */
		loginNotifications: boolean;
		/** Security alerts */
		securityAlerts: boolean;
		/** Data export */
		dataExport: boolean;
		/** Account deletion */
		accountDeletion: boolean;
	};
	/** Privacy settings */
	privacy: {
		/** Profile visibility */
		profileVisibility: 'public' | 'private' | 'friends';
		/** Show online status */
		showOnlineStatus: boolean;
		/** Show activity */
		showActivity: boolean;
		/** Show achievements */
		showAchievements: boolean;
		/** Show friends */
		showFriends: boolean;
		/** Show statistics */
		showStatistics: boolean;
	};
	/** Notification settings */
	notifications: {
		/** Email notifications */
		email: boolean;
		/** Push notifications */
		push: boolean;
		/** SMS notifications */
		sms: boolean;
		/** Game notifications */
		game: boolean;
		/** Social notifications */
		social: boolean;
		/** System notifications */
		system: boolean;
	};
	/** Game settings */
	game: {
		/** Default difficulty */
		defaultDifficulty: string;
		/** Default topic */
		defaultTopic: string;
		/** Default game mode */
		defaultGameMode: string;
		/** Time limit */
		timeLimit: number;
		/** Question limit */
		questionLimit: number;
		/** Sound enabled */
		soundEnabled: boolean;
		/** Animations enabled */
		animationsEnabled: boolean;
		/** Auto-save enabled */
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
	/** Username */
	username?: string;
	/** Email */
	email?: string;
	/** First name */
	firstName?: string;
	/** Last name */
	lastName?: string;
	/** Bio */
	bio?: string;
	/** Website */
	website?: string;
	/** Avatar URL */
	avatar?: string;
	/** Date of birth */
	dateOfBirth?: Date;
	/** Country */
	country?: string;
	/** Timezone */
	timezone?: string;
	/** Language preference */
	language?: string;
	/** User preferences */
	preferences?: UserPreferences;
	/** User address */
	address?: UserAddress;
	/** Additional info */
	additional_info?: string;
}

/**
 * User profile interface
 * @interface UserProfile
 * @description User profile data
 * @used_by server: server/src/features/user/user.service.ts (getUserProfile method)
 */
export interface UserProfile {
	/** User ID */
	userId: string;
	/** Username */
	username: string;
	/** Email */
	email: string;
	/** First name */
	firstName?: string;
	/** Last name */
	lastName?: string;
	/** Bio */
	bio?: string;
	/** Website */
	website?: string;
	/** Avatar URL */
	avatar?: string;
	/** Date of birth */
	dateOfBirth?: Date;
	/** Country */
	country?: string;
	/** Timezone */
	timezone?: string;
	/** Language preference */
	language?: string;
	/** User preferences */
	preferences?: UserPreferences;
	/** User address */
	address?: UserAddress;
	/** Created at */
	createdAt: Date;
	/** Updated at */
	updatedAt: Date;
}

/**
 * User stats interface
 * @interface UserStats
 * @description User statistics
 * @used_by server: server/src/features/user/user.service.ts (getUserStats method)
 */
export interface UserStats {
	/** User ID */
	userId: string;
	/** Total games played */
	totalGames: number;
	/** Total questions answered */
	totalQuestions: number;
	/** Total correct answers */
	totalCorrectAnswers: number;
	/** Success rate */
	successRate: number;
	/** Average score */
	averageScore: number;
	/** Best score */
	bestScore: number;
	/** Total play time */
	totalPlayTime: number;
	/** Current streak */
	currentStreak: number;
	/** Best streak */
	bestStreak: number;
	/** Favorite topic */
	favoriteTopic: string;
	/** Last played */
	lastPlayed: Date;
}

/**
 * Server user preferences interface
 * @interface ServerUserPreferences
 * @description Server-side user preferences
 * @used_by server: server/src/features/user/entities/user.entity.ts (User entity)
 */
export interface ServerUserPreferences {
	/** Theme preference */
	theme: 'light' | 'dark' | 'auto';
	/** Language preference */
	language: string;
	/** Timezone */
	timezone: string;
	/** Email notifications */
	emailNotifications: boolean;
	/** Push notifications */
	pushNotifications: boolean;
	/** Sound enabled */
	soundEnabled: boolean;
	/** Music enabled */
	musicEnabled: boolean;
	/** Animations enabled */
	animationsEnabled: boolean;
	/** Auto-save enabled */
	autoSaveEnabled: boolean;
	/** Privacy settings */
	privacy: {
		/** Profile visibility */
		profileVisibility: 'public' | 'private' | 'friends';
		/** Show online status */
		showOnlineStatus: boolean;
		/** Show activity */
		showActivity: boolean;
		/** Show achievements */
		showAchievements: boolean;
	};
	/** Game preferences */
	game: {
		/** Time limit preference */
		timeLimit: number;
		/** Question limit preference */
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
export interface RepositoryWhereCondition extends Record<string, BasicValue | { $like: string } | { $in: string[] }> {
}

export interface RepositoryUpdateData extends Record<string, BasicValue | Date | null | undefined> {
}

// TypeORM Query Types
export interface UserTypeORMWhereCondition extends Record<string, BasicValue | { $like: string } | { $in: string[] } | Array<Record<string, BasicValue | { $like: string }>>> {
}

// User with Subscription
export interface UserWithSubscription extends User {
	subscription?: {
		type: string;
		status: string;
		expiresAt?: string;
	};
}
