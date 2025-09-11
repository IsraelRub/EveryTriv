/**
 * Repository Decorators
 *
 * @module RepositoryDecorators
 * @description Decorators for repository methods with enhanced functionality
 * @author EveryTriv Team
 */
import { SetMetadata } from '@nestjs/common';

/**
 * Set cache configuration for repository method
 * @param ttl Time to live in seconds
 * @param key Cache key (optional)
 * @returns Method decorator that sets repository cache
 * @example
 * ```typescript
 * @RepositoryCache(300, 'user-profile')
 * async findUserProfile(userId: string) {
 *   // Repository method with cache
 * }
 * ```
 */
export const RepositoryCache = (ttl: number, key?: string) => SetMetadata('repositoryCache', { ttl, key });

/**
 * Set permissions required for repository method
 * @param permissions Array of required permissions
 * @returns Method decorator that sets repository permissions
 * @example
 * ```typescript
 * @RepositoryPermissions('read:user', 'write:profile')
 * async updateUserProfile(userId: string, data: Record<string, unknown>) {
 *   // Repository method with permissions
 * }
 * ```
 */
export const RepositoryPermissions = (...permissions: string[]) => SetMetadata('repositoryPermissions', permissions);

/**
 * Set roles required for repository method
 * @param roles Array of required roles
 * @returns Method decorator that sets repository roles
 * @example
 * ```typescript
 * @RepositoryRoles('admin', 'moderator')
 * async deleteUser(userId: string) {
 *   // Repository method with roles
 * }
 * ```
 */
export const RepositoryRoles = (...roles: string[]) => SetMetadata('repositoryRoles', roles);

/**
 * Set audit action for repository method
 * @param action Audit action name
 * @returns Method decorator that sets repository audit
 * @example
 * ```typescript
 * @RepositoryAudit('user:update')
 * async updateUser(userId: string, data: Record<string, unknown>) {
 *   // Repository method with audit
 * }
 * ```
 */
export const RepositoryAudit = (action: string) => SetMetadata('repositoryAudit', { action });

/**
 * Mark repository method as requiring transaction
 * @returns Method decorator that sets repository transaction
 * @example
 * ```typescript
 * @RepositoryTransaction()
 * async transferPoints(fromUserId: string, toUserId: string, amount: number) {
 *   // Repository method with transaction
 * }
 * ```
 */
export const RepositoryTransaction = () => SetMetadata('repositoryTransaction', true);

/**
 * Set bulk operation configuration for repository method
 * @param batchSize Batch size for bulk operations
 * @returns Method decorator that sets repository bulk configuration
 * @example
 * ```typescript
 * @RepositoryBulk(50)
 * async bulkUpdateUsers(users: User[]) {
 *   // Repository method with bulk operations
 * }
 * ```
 */
export const RepositoryBulk = (batchSize: number = 100) => SetMetadata('repositoryBulk', { batchSize });

/**
 * Set validation schema for repository method
 * @param schema Validation schema name
 * @returns Method decorator that sets repository validation
 * @example
 * ```typescript
 * @RepositoryValidate('userUpdateSchema')
 * async updateUser(userId: string, data: Record<string, unknown>) {
 *   // Repository method with validation
 * }
 * ```
 */
export const RepositoryValidate = (schema: string) => SetMetadata('repositoryValidate', { schema });

/**
 * Set rate limit for repository method
 * @param limit Maximum number of calls
 * @param window Time window in seconds
 * @returns Method decorator that sets repository rate limit
 * @example
 * ```typescript
 * @RepositoryRateLimit(100, 3600)
 * async expensiveQuery() {
 *   // Repository method with rate limit
 * }
 * ```
 */
export const RepositoryRateLimit = (limit: number, window: number) => SetMetadata('repositoryRateLimit', { limit, window });

/**
 * Set retry configuration for repository method
 * @param maxRetries Maximum number of retries
 * @param delay Delay between retries in milliseconds
 * @returns Method decorator that sets repository retry configuration
 * @example
 * ```typescript
 * @RepositoryRetry(3, 1000)
 * async unreliableOperation() {
 *   // Repository method with retry logic
 * }
 * ```
 */
export const RepositoryRetry = (maxRetries: number, delay: number = 1000) => 
	SetMetadata('repositoryRetry', { maxRetries, delay });

/**
 * Set timeout for repository method
 * @param timeout Timeout in milliseconds
 * @returns Method decorator that sets repository timeout
 * @example
 * ```typescript
 * @RepositoryTimeout(5000)
 * async slowOperation() {
 *   // Repository method with timeout
 * }
 * ```
 */
export const RepositoryTimeout = (timeout: number) => SetMetadata('repositoryTimeout', { timeout });

/**
 * Set logging configuration for repository method
 * @param level Log level
 * @param includeData Whether to include data in logs
 * @returns Method decorator that sets repository logging
 * @example
 * ```typescript
 * @RepositoryLogging('debug', true)
 * async sensitiveOperation(data: Record<string, unknown>) {
 *   // Repository method with detailed logging
 * }
 * ```
 */
export const RepositoryLogging = (level: 'debug' | 'info' | 'warn' | 'error', includeData: boolean = false) => 
	SetMetadata('repositoryLogging', { level, includeData });

/**
 * Set performance monitoring for repository method
 * @param threshold Performance threshold in milliseconds
 * @returns Method decorator that sets repository performance monitoring
 * @example
 * ```typescript
 * @RepositoryPerformance(1000)
 * async performanceCriticalOperation() {
 *   // Repository method with performance monitoring
 * }
 * ```
 */
export const RepositoryPerformance = (threshold: number) => SetMetadata('repositoryPerformance', { threshold });