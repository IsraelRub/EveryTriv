/**
 * Client Types Index
 *
 * @module ClientTypes
 * @description Central export file for all client-side TypeScript types and interfaces
 * @author EveryTriv Team
 */

/**
 * Animation types
 * @description Animation configuration, particle effects, and score animation types
 * @exports {Object} Animation-related type definitions
 */
// Animation types moved to ui.types

/**
 * Audio types
 * @description Audio service interfaces, state management, and performance tracking
 * @exports {Object} Audio-related type definitions
 */
// Audio types moved to ui.types

/**
 * Form types
 * @description Form field definitions and validation props
 * @exports {Object} Form-related type definitions
 */
// Form types moved to ui.types

/**
 * Game types
 * @description Game state, configuration, and component props
 * @exports {Object} Game-related type definitions
 */
export * from './game';

/**
 * Shared game constants
 * @description Re-exported shared game constants
 */
export { GameMode, DifficultyLevel } from '@shared';

/**
 * UI component types
 * @description Re-exported UI component prop types
 * @exports {Object} UI component type definitions
 */
export * from './ui';

// UI Component Types
export * from './ui/components/components.base.types';
export * from './ui/components/components.stats.types';
export * from './ui/components/components.analytics.types';
export * from './ui/components/components.leaderboard.types';

/**
 * Utility functions
 * @description Re-exported utility functions
 * @exports {Function} Client utility functions
 */
export { getOrCreateClientUserId } from '../utils';

/**
 * Redux types
 * @description Redux state management, async operations, and action types
 * @exports {Object} Redux-related type definitions
 */
export * from './redux';

// Redux types alias
export * from './redux/state.types';

/**
 * Points types
 * @description Point balance, transactions, and purchase options
 * @exports {Object} Points-related type definitions
 */
export type { PointBalance, PointPurchaseOption, PointTransaction, TransferResult } from './points.types';

/**
 * API types
 * @description API service interfaces and response types
 * @exports {Object} API-related type definitions
 */
export type { ApiResponse, ClientApiService } from './api.types';

/**
 * Shared types
 * @description Re-exported shared types for authentication and game data
 * @exports {Object} Shared type definitions
 */
export type {
	AuthCredentials,
	AuthResponse,
	CreateGameHistoryDto,
	LeaderboardEntry,
	TriviaQuestion,
	TriviaRequest,
} from '@shared';

// Question count option type
export interface QuestionCountOption {
	value: number;
	label: string;
}

// History item type
export interface HistoryItem {
	topic: string;
	difficulty: string;
	score: number;
	date: string;
	timestamp?: number;
}

// Score stats type
export interface ScoreStats {
	correct: number;
	total: number;
	grade?: string;
	color?: string;
	percentage?: number;
}

// UI types are now exported from './ui' above

/**
 * Statistics types
 * @description User statistics and analytics response types
 * @exports {Object} Statistics-related type definitions
 */
// Stats types moved to redux.types

/**
 * User types
 * @description User profiles, authentication, and preferences
 * @exports {Object} User-related type definitions
 */
export type {
	ExtendedUserProfileUpdateRequest,
	NotificationSettings,
	RegistrationData,
	RegistrationFormData,
	User,
	UserAuthResponse,
	UserLoginRequest,
	UserPreferences,
	UserProfile,
	UserProfileCompleteRequest,
	UserProfileUpdateRequest,
	UserRegisterRequest,
} from './user.types';

/**
 * Authentication types
 * @description Authentication route components and auth-related types
 * @exports {Object} Authentication-related type definitions
 */
export type {
	ProtectedRouteProps,
	PublicRouteProps,
	AuthRouteState,
} from './auth';
