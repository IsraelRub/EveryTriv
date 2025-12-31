/**
 * Authentication Decorators
 *
 * @module AuthDecorators
 * @description Decorators for authentication and authorization
 * @author EveryTriv Team
 */
import { SetMetadata } from '@nestjs/common';

/**
 * Mark endpoint as public (skip authentication)
 * @returns Method decorator that marks endpoint as public
 */
export const Public = () => SetMetadata('isPublic', true);

/**
 * Define required roles for endpoint access
 * @param roles Array of role names required for access
 * @returns Method decorator that defines required roles
 */
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

/**
 * Mark endpoint as requiring specific user status
 * @param statuses Array of required user statuses (from UserStatus enum)
 * @returns Method decorator that requires specific user status
 */
export const RequireUserStatus = (...statuses: string[]) => SetMetadata('requireUserStatus', statuses);

/**
 * Mark endpoint as requiring email verification
 * @returns Method decorator that requires email verification
 */
export const RequireEmailVerified = () => SetMetadata('requireEmailVerified', true);
