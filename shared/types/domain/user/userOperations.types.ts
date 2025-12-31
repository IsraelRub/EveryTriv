/**
 * User Operations Types for EveryTriv
 *
 * @module UserOperationsTypes
 * @description User operations and profile management types shared between client and server
 */
import type { UserPreferences, UserProfile } from './user.types';

/**
 * Custom difficulty item interface
 * @interface CustomDifficultyItem
 * @description Individual custom difficulty entry with usage tracking
 * @used_by server/src/features/user/dtos/user.dto.ts
 */
export interface CustomDifficultyItem {
	description: string;
	usageCount: number;
	lastUsed: Date;
}

/**
 * User profile response interface
 * @interface UserProfileResponseType
 * @description Unified response payload for user profile data - combines profile data, preferences, statistics, achievements, and badges
 * @used_by client/src/services/api.service.ts, client/src/hooks/api/useUserPreferences.ts
 */
export interface UserProfileResponseType {
	profile: UserProfile;
	preferences: Partial<UserPreferences>;
}
