/**
 * User-related types specific to the server
 * These types are used internally by the server and are not shared with the client
 *
 * @module ServerUserTypes
 * @description Server-specific user metadata and internal types
 * @used_by server/src/features/user/dtos/create-user.dto.ts, server/src/shared/entities/user.entity.ts
 */
import type { User, UserAddress, BaseUser } from '@shared';

// Re-export shared types
export type { UserAddress, User, BaseUser };

