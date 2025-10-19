/**
 * User-related types specific to the server
 * These types are used internally by the server and are not shared with the client
 *
 * @module ServerUserTypes
 * @description Server-specific user metadata and internal types
 * @used_by server/src/features/user/dtos, server/src/internal/entities
 */
import type { BaseUser, User, UserAddress } from '@shared/types';

// Re-export shared types
export type { BaseUser, User, UserAddress };
