import { DifficultyLevel } from '../constants';
import type { GenericDataValue } from './data.types';

/**
 * User-related types for EveryTriv
 * Shared between client and server
 *
 * @module UserTypes
 * @description Core user interfaces used across the entire application
 */

/**
 * User address interface for user management
 * @interface UserAddress
 * @description Complete address information for users
 * @used_by server: server/src/shared/entities/user.entity.ts (UserEntity), client: client/src/components/user/CompleteProfile.tsx (profile display), server/src/features/user/dtos/create-user.dto.ts (user creation)
 */
export interface UserAddress {
	/** Country code */
	country?: string;
	/** State or province */
	state?: string;
	/** City name */
	city?: string;
	/** Street address */
	street?: string;
	/** ZIP or postal code */
	zipCode?: string;
	/** Apartment or unit number */
	apartment?: string;
}

/**
 * Base user profile interface with core fields
 * @interface UserProfile
 * @description Basic user information shared between client and server
 * @used_by server: server/src/shared/entities/user.entity.ts (UserEntity), client: client/src/components/user/CompleteProfile.tsx (profile display), shared/validation/validation.utils.ts (user validation)
 */
export interface UserProfile {
	/** Unique user identifier */
	id: string;
	/** Unique username */
	username: string;
	/** User email address */
	email: string;
	/** Optional avatar URL */
	avatar?: string;
	/** User game score */
	score: number;
	/** User credit balance */
	credits: number;
	/** Account creation timestamp */
	created_at: Date;
	/** Last update timestamp */
	updated_at: Date;
}

/**
 * Extended user interface with additional authentication fields
 * @interface User
 * @description Complete user object including OAuth information
 * @used_by server: server/src/features/auth/auth.service.ts (AuthService), client: client/src/services/auth.service.ts (AuthService), server/src/shared/entities/user.entity.ts (UserEntity)
 */
export interface User extends UserProfile {
	/** Full display name */
	full_name?: string;
	/** Google OAuth ID */
	google_id?: string;
	/** User role */
	role?: string;
	/** User address information */
	address?: UserAddress;
}

/**
 * User score data for analytics and ranking
 * @interface UserScoreData
 * @description Simplified user score information for leaderboards
 * @used_by server: server/src/features/analytics/analytics.service.ts (user analytics), client: client/src/components/leaderboard/Leaderboard.tsx (leaderboard display), server/src/features/gameHistory/gameHistory.service.ts (score tracking)
 */
export interface UserScoreData {
	/** User identifier */
	userId: string;
	/** Current user score */
	score: number;
	/** Current rank position */
	rank: number;
}

/**
 * Comprehensive user statistics interface
 * @interface UserStats
 * @description Detailed statistics about user performance
 * @used_by server: server/src/features/analytics/analytics.service.ts (user statistics), client: client/src/components/stats/StatsCharts.tsx (stats display), server/src/features/gameHistory/gameHistory.service.ts (stats calculation)
 */
export interface UserStats {
	/** Stats record ID */
	id: string;
	/** Associated user ID */
	userId: string;
	/** Topics played with question counts */
	topicsPlayed: Record<string, number>;
	/** Difficulty statistics with correct/total ratios */
	difficultyStats: Record<string, { correct: number; total: number }>;
	/** Total questions answered */
	totalQuestions: number;
	/** Total correct answers */
	correctAnswers: number;
	/** Last gameplay timestamp */
	lastPlayed: Date;
}

/**
 * Leaderboard entry interface for rankings
 * @interface LeaderboardEntry
 * @description Complete leaderboard entry with user performance data
 * @used_by server: server/src/features/gameHistory/gameHistory.service.ts (leaderboard generation), client: client/src/components/leaderboard/Leaderboard.tsx (leaderboard display), server/src/features/analytics/analytics.service.ts (ranking analytics)
 */
export interface LeaderboardEntry {
	/** User identifier */
	userId: string;
	/** Display username */
	username: string;
	/** Current score */
	score: number;
	/** Current rank */
	rank: number;
	/** Total questions answered */
	totalQuestions: number;
	/** Total correct answers */
	correctAnswers: number;
	/** Success rate percentage */
	successRate: number;
	/** Last gameplay date */
	lastPlayed?: Date;
	/** User avatar URL */
	avatar?: string;
	/** Total games played */
	gamesPlayed?: number;
}

/**
 * User ranking data interface
 * @interface UserRankData
 * @description User's position and percentile in rankings
 * @used_by client/services/api, client/services/gameHistory, server/game-history
 */
export interface UserRankData {
	/** Current user rank */
	rank: number;
	/** Total number of users */
	totalUsers: number;
	/** User's percentile */
	percentile: number;
}

/**
 * User statistics data interface
 * @interface UserStatsData
 * @description Comprehensive user performance statistics
 * @used_by client/services/api, client/services/gameHistory, server/game-history
 */
export interface UserStatsData {
	/** Total questions answered */
	totalQuestions: number;
	/** Total correct answers */
	correctAnswers: number;
	/** Success rate percentage */
	successRate: number;
	/** Average score */
	averageScore: number;
	/** Total games played */
	gamesPlayed: number;
	/** Topics played with counts */
	topicsPlayed: Record<string, number>;
	/** Difficulty statistics */
	difficultyStats: Record<string, { correct: number; total: number }>;
}

/**
 * User profile update data interface
 * @interface UserProfileUpdateData
 * @description Data structure for updating user profile information
 * @used_by client/src/services/user, client/src/components/user
 */
export interface UserProfileUpdateData extends Record<string, unknown> {
	/** User's username */
	username?: string;
	/** User's email address */
	email?: string;
	/** User's full name */
	full_name?: string;
	/** User's first name */
	first_name?: string;
	/** User's last name */
	last_name?: string;
	/** User's phone number */
	phone?: string;
	/** User's date of birth */
	date_of_birth?: string;
	/** User's avatar URL */
	avatar?: string;
	/** User's address */
	address?: {
		country?: string;
		state?: string;
		city?: string;
		street?: string;
		zipCode?: string;
		apartment?: string;
	};
	/** User preferences */
	preferences?: UserPreferencesUpdate;
	/** Additional information */
	additional_info?: string;
	/** Newsletter agreement */
	agree_to_newsletter?: boolean;
}

/**
 * User profile update data interface (alias for backward compatibility)
 * @interface UpdateUserProfileData
 * @description Data structure for updating user profile information
 * @used_by client/src/services/user, client/src/components/user
 */
export type UpdateUserProfileData = UserProfileUpdateData;

/**
 * User preferences interface
 * @interface UserPreferences
 * @description User preferences and settings
 */
export interface UserPreferences {
	/** Preferred language */
	language?: string;
	/** Preferred theme */
	theme?: 'light' | 'dark' | 'auto';
	/** Sound enabled */
	soundEnabled?: boolean;
	/** Music enabled */
	musicEnabled?: boolean;
	/** Notification settings */
	notifications?: {
		email?: boolean;
		push?: boolean;
		gameReminders?: boolean;
	};
	/** Game preferences */
	gamePreferences?: {
		defaultDifficulty?: string;
		defaultTopic?: string;
		questionCount?: number;
		timeLimit?: number;
	};
	/** Accessibility settings */
	accessibility?: {
		highContrast?: boolean;
		largeText?: boolean;
		screenReader?: boolean;
	};
	/** Additional custom preferences */
	[key: string]: GenericDataValue;
}

/**
 * Server-specific user preferences interface
 * @interface ServerUserPreferences
 * @description User preferences format expected by the server
 * @used_by server/src/shared/entities/user.entity.ts, server/src/features/user/user.service.ts
 */
export interface ServerUserPreferences {
	/** Theme preference (server doesn't support 'auto') */
	theme?: 'light' | 'dark';
	/** Language preference */
	language?: string;
	/** Notification settings */
	notifications?: boolean;
	/** Favorite topics */
	favoriteTopics?: string[];
	/** Default difficulty */
	difficulty?: DifficultyLevel;
	/** Custom difficulties */
	customDifficulties?: Array<{
		description: string;
		usageCount: number;
		lastUsed: Date;
	}>;
}

/**
 * User preferences update interface
 * @interface UserPreferencesUpdate
 * @description Interface for updating user preferences (all fields optional for partial updates)
 * @used_by server/src/features/user/user.service.ts, server/src/features/user/user.controller.ts
 */
export interface UserPreferencesUpdate {
	/** Theme preference (server doesn't support 'auto') */
	theme?: 'light' | 'dark';
	/** Language preference */
	language?: string;
	/** Notification settings */
	notifications?: boolean;
	/** Favorite topics */
	favoriteTopics?: string[];
	/** Default difficulty */
	difficulty?: DifficultyLevel;
	/** Custom difficulties */
	customDifficulties?: Array<{
		description: string;
		usageCount: number;
		lastUsed: Date;
	}>;
}

/**
 * User preferences map interface
 * @interface UserPreferencesMap
 * @description Map structure for user preferences
 */
export interface UserPreferencesMap {
	[key: string]: UserPreferences;
}

/**
 * User rank interface
 * @interface UserRank
 * @description User ranking information
 * @used_by client/src/services/api.service.ts (getUserRank)
 */
export interface UserRank {
	/** User's current rank */
	rank: number;
	/** Total number of users */
	totalUsers: number;
	/** User's score */
	score: number;
	/** User's percentile */
	percentile: number;
	/** Rank category */
	category: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
}

/**
 * User statistics interface
 * @interface UserStats
 * @description User game statistics and performance data
 * @used_by client/src/services/api.service.ts (getUserStats)
 */
export interface UserStats {
	/** Total games played */
	totalGames: number;
	/** Total questions answered */
	totalQuestions: number;
	/** Correct answers */
	correctAnswers: number;
	/** Incorrect answers */
	incorrectAnswers: number;
	/** Success rate percentage */
	successRate: number;
	/** Average score per game */
	averageScore: number;
	/** Highest score achieved */
	highestScore: number;
	/** Total time played in seconds */
	totalTimePlayed: number;
	/** Average time per question */
	averageTimePerQuestion: number;
	/** Current streak */
	currentStreak: number;
	/** Longest streak */
	longestStreak: number;
	/** Favorite topics */
	favoriteTopics: string[];
	/** Difficulty breakdown */
	difficultyBreakdown: Record<
		string,
		{
			games: number;
			correct: number;
			total: number;
			successRate: number;
		}
	>;
	/** Recent performance (last 10 games) */
	recentPerformance: Array<{
		date: string;
		score: number;
		correct: number;
		total: number;
	}>;
}
