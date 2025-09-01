/**
 * User-related types specific to the server
 * These types are used internally by the server and are not shared with the client
 *
 * @module ServerUserTypes
 * @description Server-specific user metadata and internal types
 * @used_by server/src/features/user/dtos/create-user.dto.ts, server/src/shared/entities/user.entity.ts
 */
import { UserAddress } from 'everytriv-shared/types';

// Re-export shared UserAddress type
export type { UserAddress };

// User metadata interface for server-side tracking
export interface UserMetadata {
	registrationSource?: 'web' | 'mobile' | 'oauth';
	lastLoginAt?: Date;
	loginCount?: number;
	deviceInfo?: {
		userAgent?: string;
		ipAddress?: string;
		deviceType?: 'desktop' | 'mobile' | 'tablet';
	};
}
