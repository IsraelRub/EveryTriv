/**
 * User profile types for EveryTriv
 *
 * @module UserProfileTypes
 * @description Type definitions for user profile management and updates
 */
import type { BasicValue } from '../../core/data.types';

/**
 * User profile update data interface
 * @interface UserProfileUpdateData
 * @description Data structure for updating user profile information
 * @used_by server/src/features/user/user.service.ts
 */

/**
 * User profile update request interface
 * @interface UserProfileUpdateRequest
 * @description Request payload for updating user profile
 * @used_by client/src/services/api.service.ts, client/src/hooks/api/useUserPreferences.ts
 */
export interface UserProfileUpdateRequest {
	userId: string;
	profileData: Record<string, BasicValue>;
	preferences?: UserPreferencesUpdate;
}

/**
 * User preferences update interface
 * @interface UserPreferencesUpdate
 * @description Data structure for updating user preferences
 * @used_by client/src/components/user/UserProfile.tsx, client/src/hooks/api/useUserPreferences.ts
 */
export interface UserPreferencesUpdate {
	theme?: 'light' | 'dark' | 'auto';
	language?: string;
	timezone?: string;
	emailNotifications?: boolean;
	pushNotifications?: boolean;
	notifications?: boolean;
	soundEnabled?: boolean;
	animationsEnabled?: boolean;
	autoSaveEnabled?: boolean;
	favoriteTopics?: string[];
	privacy?: {
		profileVisibility?: 'public' | 'private' | 'friends';
		showOnlineStatus?: boolean;
		showActivity?: boolean;
		showAchievements?: boolean;
	};
	game?: {
		defaultDifficulty?: string;
		defaultTopic?: string;
		defaultGameMode?: string;
		timeLimit?: number;
		questionLimit?: number;
	};
}

/**
 * User profile response interface
 * @interface UserProfileResponse
 * @description Response payload for user profile data
 * @used_by client/src/services/api.service.ts, client/src/hooks/api/useUserPreferences.ts
 */
export interface UserProfileResponseType {
	profile: Record<string, BasicValue>;
	preferences: UserPreferencesUpdate;
	statistics?: {
		totalGames: number;
		totalQuestions: number;
		successRate: number;
		level: number;
		experiencePoints: number;
	};
	achievements?: Array<{
		id: string;
		name: string;
		description: string;
		icon: string;
		unlockedAt: Date;
	}>;
	badges?: Array<{
		id: string;
		name: string;
		description: string;
		icon: string;
		color: string;
		unlockedAt: Date;
		isEquipped: boolean;
	}>;
}

/**
 * User profile validation interface
 * @interface UserProfileValidation
 * @description Validation result for user profile data
 * @used_by client/src/components/user/UserProfile.tsx, client/src/hooks/api/useUserPreferences.ts
 */
export interface UserProfileValidation {
	isValid: boolean;
	errors: Record<string, string[]>;
	warnings?: Record<string, string[]>;
	suggestions?: Record<string, string[]>;
}

/**
 * User profile search interface
 * @interface UserProfileSearch
 * @description Search parameters for user profiles
 * @used_by client/src/components/user/UserProfile.tsx, client/src/hooks/api/useUserPreferences.ts
 */
export interface UserProfileSearch {
	query: string;
	filters?: {
		country?: string;
		language?: string;
		levelRange?: {
			min: number;
			max: number;
		};
		onlineStatus?: 'online' | 'offline' | 'all';
	};
	pagination?: {
		page: number;
		pageSize: number;
	};
	sort?: {
		field: string;
		direction: 'asc' | 'desc';
	};
}

/**
 * User profile search result interface
 * @interface UserProfileSearchResult
 * @description Search result for user profiles
 * @used_by client/src/components/user/UserProfile.tsx, client/src/hooks/api/useUserPreferences.ts
 */
export interface UserProfileSearchResult {
	results: Array<{
		userId: string;
		username: string;
		avatar?: string;
		level: number;
		score: number;
		onlineStatus: 'online' | 'offline' | 'away' | 'busy';
		country?: string;
		language?: string;
		lastSeen: Date;
	}>;
	totalCount: number;
	currentPage: number;
	totalPages: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
}
