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
 * Require specific permissions for endpoint access
 * @param permissions Array of permission names required for access
 * @returns Method decorator that defines required permissions
 */
export const Permissions = (...permissions: string[]) => SetMetadata('permissions', permissions);

/**
 * Mark endpoint as requiring authentication but no specific role
 * @returns Method decorator that requires authentication
 */
export const RequireAuth = () => SetMetadata('requireAuth', true);

/**
 * Mark endpoint as requiring specific user status
 * @param statuses Array of required user statuses
 * @returns Method decorator that requires specific user status
 */
export const RequireUserStatus = (...statuses: string[]) => SetMetadata('requireUserStatus', statuses);

/**
 * Mark endpoint as requiring email verification
 * @returns Method decorator that requires email verification
 */
export const RequireEmailVerified = () => SetMetadata('requireEmailVerified', true);

/**
 * Mark endpoint as requiring phone verification
 * @returns Method decorator that requires phone verification
 */
export const RequirePhoneVerified = () => SetMetadata('requirePhoneVerified', true);

/**
 * Mark endpoint as requiring subscription
 * @param subscriptionTypes Array of required subscription types
 * @returns Method decorator that requires subscription
 */
export const RequireSubscription = (...subscriptionTypes: string[]) =>
	SetMetadata('requireSubscription', subscriptionTypes);

/**
 * Mark endpoint as requiring minimum points balance
 * @param minPoints Minimum points required
 * @returns Method decorator that requires minimum points
 */
export const RequireMinPoints = (minPoints: number) => SetMetadata('requireMinPoints', minPoints);
