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
 * @used_by server/src/features/user/user.service.ts, client/src/components/user/UserProfile.tsx
 */

/**
 * User profile update request interface
 * @interface UserProfileUpdateRequest
 * @description Request payload for updating user profile
 * @used_by client/src/services/api.service.ts, client/src/hooks/api/useUserPreferences.ts
 */
export interface UserProfileUpdateRequest {
	/** User ID */
	userId: string;
	/** Profile update data */
	profileData: Record<string, BasicValue>;
	/** User preferences */
	preferences?: UserPreferencesUpdate;
}

/**
 * User preferences update interface
 * @interface UserPreferencesUpdate
 * @description Data structure for updating user preferences
 * @used_by client/src/components/user/UserProfile.tsx, client/src/hooks/api/useUserPreferences.ts
 */
export interface UserPreferencesUpdate {
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
	/** Notifications */
	notifications?: boolean;
	/** Sound enabled */
	soundEnabled?: boolean;
	/** Animations enabled */
	animationsEnabled?: boolean;
	/** Auto-save enabled */
	autoSaveEnabled?: boolean;
	/** Favorite topics */
	favoriteTopics?: string[];
	/** Privacy settings */
	privacy?: {
		/** Profile visibility */
		profileVisibility?: 'public' | 'private' | 'friends';
		/** Show online status */
		showOnlineStatus?: boolean;
		/** Show activity */
		showActivity?: boolean;
		/** Show achievements */
		showAchievements?: boolean;
	};
	/** Game preferences */
	game?: {
		/** Default difficulty */
		defaultDifficulty?: string;
		/** Default topic */
		defaultTopic?: string;
		/** Default game mode */
		defaultGameMode?: string;
		/** Time limit preference */
		timeLimit?: number;
		/** Question limit preference */
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
	/** User profile data */
	profile: Record<string, BasicValue>;
	/** User preferences */
	preferences: UserPreferencesUpdate;
	/** User statistics */
	statistics?: {
		/** Total games played */
		totalGames: number;
		/** Total questions answered */
		totalQuestions: number;
		/** Success rate */
		successRate: number;
		/** Level */
		level: number;
		/** Experience points */
		experiencePoints: number;
	};
	/** User achievements */
	achievements?: Array<{
		/** Achievement ID */
		id: string;
		/** Achievement name */
		name: string;
		/** Achievement description */
		description: string;
		/** Achievement icon */
		icon: string;
		/** Achievement unlocked date */
		unlockedAt: Date;
	}>;
	/** User badges */
	badges?: Array<{
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
		/** Badge unlocked date */
		unlockedAt: Date;
		/** Whether badge is equipped */
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
	/** Whether profile data is valid */
	isValid: boolean;
	/** Validation errors */
	errors: Record<string, string[]>;
	/** Validation warnings */
	warnings?: Record<string, string[]>;
	/** Validation suggestions */
	suggestions?: Record<string, string[]>;
}

/**
 * User profile search interface
 * @interface UserProfileSearch
 * @description Search parameters for user profiles
 * @used_by client/src/components/user/UserProfile.tsx, client/src/hooks/api/useUserPreferences.ts
 */
export interface UserProfileSearch {
	/** Search query */
	query: string;
	/** Search filters */
	filters?: {
		/** Country filter */
		country?: string;
		/** Language filter */
		language?: string;
		/** Level range */
		levelRange?: {
			min: number;
			max: number;
		};
		/** Online status */
		onlineStatus?: 'online' | 'offline' | 'all';
	};
	/** Pagination */
	pagination?: {
		/** Page number */
		page: number;
		/** Page size */
		pageSize: number;
	};
	/** Sort options */
	sort?: {
		/** Sort field */
		field: string;
		/** Sort direction */
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
	/** Search results */
	results: Array<{
		/** User ID */
		userId: string;
		/** Username */
		username: string;
		/** Avatar */
		avatar?: string;
		/** Level */
		level: number;
		/** Score */
		score: number;
		/** Online status */
		onlineStatus: 'online' | 'offline' | 'away' | 'busy';
		/** Country */
		country?: string;
		/** Language */
		language?: string;
		/** Last seen */
		lastSeen: Date;
	}>;
	/** Total results count */
	totalCount: number;
	currentPage: number;
	/** Total pages */
	totalPages: number;
	/** Has next page */
	hasNextPage: boolean;
	/** Has previous page */
	hasPreviousPage: boolean;
}

