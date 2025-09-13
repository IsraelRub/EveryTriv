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
 * @example
 * ```typescript
 * @Get('public-data')
 * @Public()
 * async getPublicData() {
 *   return { message: 'This is public data' };
 * }
 * ```
 */
export const Public = () => SetMetadata('isPublic', true);

/**
 * Define required roles for endpoint access
 * @param roles Array of role names required for access
 * @returns Method decorator that defines required roles
 * @example
 * ```typescript
 * @Get('admin-only')
 * @Roles('admin', 'super-admin')
 * async getAdminData() {
 *   return { message: 'Admin only data' };
 * }
 * ```
 */
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

/**
 * Require specific permissions for endpoint access
 * @param permissions Array of permission names required for access
 * @returns Method decorator that defines required permissions
 * @example
 * ```typescript
 * @Get('sensitive-data')
 * @Permissions('read:sensitive', 'write:data')
 * async getSensitiveData() {
 *   return { message: 'Sensitive data' };
 * }
 * ```
 */
export const Permissions = (...permissions: string[]) => SetMetadata('permissions', permissions);

/**
 * Mark endpoint as requiring authentication but no specific role
 * @returns Method decorator that requires authentication
 * @example
 * ```typescript
 * @Get('user-profile')
 * @RequireAuth()
 * async getUserProfile() {
 *   return { message: 'User profile' };
 * }
 * ```
 */
export const RequireAuth = () => SetMetadata('requireAuth', true);

/**
 * Mark endpoint as requiring specific user status
 * @param statuses Array of required user statuses
 * @returns Method decorator that requires specific user status
 * @example
 * ```typescript
 * @Get('active-users')
 * @RequireUserStatus('active', 'premium')
 * async getActiveUsers() {
 *   return { message: 'Active users only' };
 * }
 * ```
 */
export const RequireUserStatus = (...statuses: string[]) => SetMetadata('requireUserStatus', statuses);

/**
 * Mark endpoint as requiring email verification
 * @returns Method decorator that requires email verification
 * @example
 * ```typescript
 * @Get('sensitive-data')
 * @RequireEmailVerified()
 * async getSensitiveData() {
 *   return { message: 'Email verified users only' };
 * }
 * ```
 */
export const RequireEmailVerified = () => SetMetadata('requireEmailVerified', true);

/**
 * Mark endpoint as requiring phone verification
 * @returns Method decorator that requires phone verification
 * @example
 * ```typescript
 * @Get('phone-required')
 * @RequirePhoneVerified()
 * async getPhoneRequired() {
 *   return { message: 'Phone verified users only' };
 * }
 * ```
 */
export const RequirePhoneVerified = () => SetMetadata('requirePhoneVerified', true);

/**
 * Mark endpoint as requiring subscription
 * @param subscriptionTypes Array of required subscription types
 * @returns Method decorator that requires subscription
 * @example
 * ```typescript
 * @Get('premium-content')
 * @RequireSubscription('premium', 'pro')
 * async getPremiumContent() {
 *   return { message: 'Premium users only' };
 * }
 * ```
 */
export const RequireSubscription = (...subscriptionTypes: string[]) =>
	SetMetadata('requireSubscription', subscriptionTypes);

/**
 * Mark endpoint as requiring minimum points balance
 * @param minPoints Minimum points required
 * @returns Method decorator that requires minimum points
 * @example
 * ```typescript
 * @Get('expensive-action')
 * @RequireMinPoints(100)
 * async performExpensiveAction() {
 *   return { message: 'Users with 100+ points only' };
 * }
 * ```
 */
export const RequireMinPoints = (minPoints: number) => SetMetadata('requireMinPoints', minPoints);
