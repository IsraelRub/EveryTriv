/**
 * User preferences types for EveryTriv
 *
 * @module UserPreferencesTypes
 * @description Type definitions for user preferences and settings management
 */

// UserPreferences is already exported from user.types.ts

/**
 * User preferences interface (extended)
 * @interface UserPreferencesExtended
 * @description Extended user preferences and settings
 * @used_by client: client/src/components/user/UserProfile.tsx (preferences display), client/src/hooks/api/useUserPreferences.ts (preferences management)
 */
export interface UserPreferencesExtended {
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
		/** Default difficulty */
		defaultDifficulty: string;
		/** Default topic */
		defaultTopic: string;
		/** Default game mode */
		defaultGameMode: string;
		/** Time limit preference */
		timeLimit: number;
		/** Question limit preference */
		questionLimit: number;
	};
}

// UserPreferencesUpdate is already exported from user.types.ts

/**
 * User preferences update interface (extended)
 * @interface UserPreferencesUpdateExtended
 * @description Extended data structure for updating user preferences
 * @used_by client: client/src/components/user/UserProfile.tsx (preferences updates), client/src/hooks/api/useUserPreferences.ts (preferences management)
 */
export interface UserPreferencesUpdateExtended {
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
	/** Animations enabled */
	animationsEnabled?: boolean;
	/** Auto-save enabled */
	autoSaveEnabled?: boolean;
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
 * User preferences validation interface
 * @interface UserPreferencesValidation
 * @description Validation result for user preferences
 * @used_by client: client/src/components/user/UserProfile.tsx (preferences validation), client/src/hooks/api/useUserPreferences.ts (validation handling)
 */
export interface UserPreferencesValidation {
	/** Whether preferences are valid */
	isValid: boolean;
	/** Validation errors */
	errors: Record<string, string[]>;
	/** Validation warnings */
	warnings?: Record<string, string[]>;
	/** Validation suggestions */
	suggestions?: Record<string, string[]>;
}

/**
 * User preferences reset interface
 * @interface UserPreferencesReset
 * @description Reset options for user preferences
 * @used_by client: client/src/components/user/UserProfile.tsx (preferences reset), client/src/hooks/api/useUserPreferences.ts (reset functionality)
 */
export interface UserPreferencesReset {
	/** Reset theme to default */
	resetTheme?: boolean;
	/** Reset language to default */
	resetLanguage?: boolean;
	/** Reset timezone to default */
	resetTimezone?: boolean;
	/** Reset notification preferences */
	resetNotifications?: boolean;
	/** Reset privacy settings */
	resetPrivacy?: boolean;
	/** Reset game preferences */
	resetGame?: boolean;
	/** Reset all preferences */
	resetAll?: boolean;
}

/**
 * User preferences export interface
 * @interface UserPreferencesExport
 * @description Export format for user preferences
 * @used_by client: client/src/components/user/UserProfile.tsx (preferences export), client/src/hooks/api/useUserPreferences.ts (export functionality)
 */
export interface UserPreferencesExport {
	/** Export timestamp */
	exportedAt: Date;
	/** Export version */
	version: string;
	/** User preferences data */
	preferences: UserPreferencesExtended;
	/** Export metadata */
	metadata: {
		/** User ID */
		userId: string;
		/** Username */
		username: string;
		/** Export format */
		format: 'json' | 'yaml' | 'xml';
		/** Export size */
		size: number;
	};
}

/**
 * User preferences import interface
 * @interface UserPreferencesImport
 * @description Import format for user preferences
 * @used_by client: client/src/components/user/UserProfile.tsx (preferences import), client/src/hooks/api/useUserPreferences.ts (import functionality)
 */
export interface UserPreferencesImport {
	/** Import file */
	file: File;
	/** Import format */
	format: 'json' | 'yaml' | 'xml';
	/** Import options */
	options: {
		/** Overwrite existing preferences */
		overwrite?: boolean;
		/** Merge with existing preferences */
		merge?: boolean;
		/** Validate before import */
		validate?: boolean;
		/** Backup existing preferences */
		backup?: boolean;
	};
}

/**
 * User preferences sync interface
 * @interface UserPreferencesSync
 * @description Sync status for user preferences
 * @used_by client: client/src/components/user/UserProfile.tsx (preferences sync), client/src/hooks/api/useUserPreferences.ts (sync functionality)
 */
export interface UserPreferencesSync {
	/** Sync status */
	status: 'synced' | 'syncing' | 'error' | 'offline';
	/** Last sync timestamp */
	lastSync?: Date;
	/** Sync error message */
	error?: string;
	/** Pending changes count */
	pendingChanges: number;
	/** Sync progress */
	progress?: number;
}
