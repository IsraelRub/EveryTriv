// Re-export shared types for convenience
export type { AuditLogEntry, CustomDifficultyItem, UserSearchCacheEntry, UserSearchCacheResult } from '@shared/types';

export interface UserRegistrationData {
	email: string;
	password: string;
	firstName?: string;
	lastName?: string;
}

export interface UserFieldConfig {
	type: 'string' | 'number' | 'boolean';
	fieldName?: string;
	minLength?: number;
	maxLength?: number;
}
