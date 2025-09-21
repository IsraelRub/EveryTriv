/**
 * User preferences types for EveryTriv
 *
 * @module UserPreferencesTypes
 * @description Type definitions for user preferences and settings management
 */


/**
 * User preferences interface (extended)
 * @interface UserPreferencesExtended
 * @description Extended user preferences and settings
 * @used_by client/src/hooks/api/useUserPreferences.ts
 */
export interface UserPreferencesExtended {
	theme: 'light' | 'dark' | 'auto';
	language: string;
	timezone: string;
	emailNotifications: boolean;
	pushNotifications: boolean;
	soundEnabled: boolean;
	animationsEnabled: boolean;
	autoSaveEnabled: boolean;
	privacy: {
		profileVisibility: 'public' | 'private' | 'friends';
		showOnlineStatus: boolean;
		showActivity: boolean;
		showAchievements: boolean;
	};
	game: {
		defaultDifficulty: string;
		defaultTopic: string;
		defaultGameMode: string;
		timeLimit: number;
		questionLimit: number;
	};
}


/**
 * User preferences update interface (extended)
 * @interface UserPreferencesUpdateExtended
 * @description Extended data structure for updating user preferences
 * @used_by client/src/hooks/api/useUserPreferences.ts
 */
export interface UserPreferencesUpdateExtended {
	theme?: 'light' | 'dark' | 'auto';
	language?: string;
	timezone?: string;
	emailNotifications?: boolean;
	pushNotifications?: boolean;
	soundEnabled?: boolean;
	animationsEnabled?: boolean;
	autoSaveEnabled?: boolean;
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
 * User preferences validation interface
 * @interface UserPreferencesValidation
 * @description Validation result for user preferences
 * @used_by client/src/hooks/api/useUserPreferences.ts
 */
export interface UserPreferencesValidation {
	isValid: boolean;
	errors: Record<string, string[]>;
	warnings?: Record<string, string[]>;
	suggestions?: Record<string, string[]>;
}

/**
 * User preferences reset interface
 * @interface UserPreferencesReset
 * @description Reset options for user preferences
 * @used_by client/src/hooks/api/useUserPreferences.ts
 */
export interface UserPreferencesReset {
	resetTheme?: boolean;
	resetLanguage?: boolean;
	resetTimezone?: boolean;
	resetNotifications?: boolean;
	resetPrivacy?: boolean;
	resetGame?: boolean;
	resetAll?: boolean;
}

/**
 * User preferences export interface
 * @interface UserPreferencesExport
 * @description Export format for user preferences
 * @used_by client/src/hooks/api/useUserPreferences.ts
 */
export interface UserPreferencesExport {
	exportedAt: Date;
	version: string;
	preferences: UserPreferencesExtended;
	metadata: {
		userId: string;
		username: string;
		format: 'json' | 'yaml' | 'xml';
		size: number;
	};
}

/**
 * User preferences import interface
 * @interface UserPreferencesImport
 * @description Import format for user preferences
 * @used_by client/src/hooks/api/useUserPreferences.ts
 */
export interface UserPreferencesImport {
	file: File;
	format: 'json' | 'yaml' | 'xml';
	options: {
		overwrite?: boolean;
		merge?: boolean;
		validate?: boolean;
		backup?: boolean;
	};
}

/**
 * User preferences sync interface
 * @interface UserPreferencesSync
 * @description Sync status for user preferences
 * @used_by client/src/hooks/api/useUserPreferences.ts
 */
export interface UserPreferencesSync {
	status: 'synced' | 'syncing' | 'error' | 'offline';
	lastSync?: Date;
	error?: string;
	pendingChanges: number;
	progress?: number;
}
