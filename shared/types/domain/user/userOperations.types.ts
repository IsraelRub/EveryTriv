// User Operations Types for EveryTriv.
import type { UserPreferences, UserProfile } from './user.types';

export interface CustomDifficultyItem {
	description: string;
	usageCount: number;
	lastUsed: Date;
}

export interface UserProfileResponseType {
	profile: UserProfile;
	preferences: Partial<UserPreferences>;
}
