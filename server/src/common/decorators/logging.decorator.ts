/**
 * Logging Decorators
 *
 * @module LoggingDecorators
 * @description Decorators for logging and monitoring
 * @author EveryTriv Team
 */
import { SetMetadata } from '@nestjs/common';

/**
 * Set custom logging configuration for endpoint
 * @param config Logging configuration
 * @returns Method decorator that sets logging configuration
 * @example
 * ```typescript
 * @Get('logged')
 * @Logging({
 *   level: 'info',
 *   includeRequest: true,
 *   includeResponse: false,
 *   includeUser: true
 * })
 * async getLoggedData() {
 *   // Endpoint with custom logging
 * }
 * ```
 */
export const Logging = (config: {
	level: 'debug' | 'info' | 'warn' | 'error';
	includeRequest?: boolean;
	includeResponse?: boolean;
	includeUser?: boolean;
	includeHeaders?: boolean;
}) => SetMetadata('logging', config);

/**
 * Set audit logging for endpoint
 * @param action Audit action name
 * @returns Method decorator that sets audit logging
 * @example
 * ```typescript
 * @Post('sensitive-action')
 * @AuditLog('user:delete')
 * async deleteUser(@CurrentUserId() userId: string) {
 *   // Endpoint with audit logging
 * }
 * ```
 */
export const AuditLog = (action: string) => SetMetadata('auditLog', { action });

/**
 * Set security logging for endpoint
 * @param level Security log level
 * @returns Method decorator that sets security logging
 * @example
 * ```typescript
 * @Post('login')
 * @SecurityLog('high')
 * async login(@Body() loginDto: LoginDto) {
 *   // Endpoint with security logging
 * }
 * ```
 */
export const SecurityLog = (level: 'low' | 'medium' | 'high' | 'critical') => SetMetadata('securityLog', { level });

/**
 * Set performance logging for endpoint
 * @param config Performance logging configuration
 * @returns Method decorator that sets performance logging
 * @example
 * ```typescript
 * @Get('performance-tracked')
 * @PerformanceLog({
 *   trackDuration: true,
 *   trackMemory: true,
 *   alertThreshold: 1000
 * })
 * async getPerformanceTrackedData() {
 *   // Endpoint with performance logging
 * }
 * ```
 */
export const PerformanceLog = (config: { trackDuration?: boolean; trackMemory?: boolean; alertThreshold?: number }) =>
	SetMetadata('performanceLog', config);

/**
 * Set error logging for endpoint
 * @param config Error logging configuration
 * @returns Method decorator that sets error logging
 * @example
 * ```typescript
 * @Get('error-tracked')
 * @ErrorLog({
 *   includeStack: true,
 *   includeContext: true,
 *   alertOnError: true
 * })
 * async getErrorTrackedData() {
 *   // Endpoint with error logging
 * }
 * ```
 */
export const ErrorLog = (config: { includeStack?: boolean; includeContext?: boolean; alertOnError?: boolean }) =>
	SetMetadata('errorLog', config);

/**
 * Set business logic logging for endpoint
 * @param category Business category
 * @returns Method decorator that sets business logging
 * @example
 * ```typescript
 * @Post('payment')
 * @BusinessLog('payment')
 * async processPayment(@Body() paymentData: PaymentDto) {
 *   // Endpoint with business logging
 * }
 * ```
 */
export const BusinessLog = (category: string) => SetMetadata('businessLog', { category });

/**
 * Set user activity logging for endpoint
 * @param activity Activity name
 * @returns Method decorator that sets user activity logging
 * @example
 * ```typescript
 * @Post('game-action')
 * @UserActivityLog('game:play')
 * async playGame(@CurrentUserId() userId: string) {
 *   // Endpoint with user activity logging
 * }
 * ```
 */
export const UserActivityLog = (activity: string) => SetMetadata('userActivityLog', { activity });

/**
 * Set API usage logging for endpoint
 * @param config API usage logging configuration
 * @returns Method decorator that sets API usage logging
 * @example
 * ```typescript
 * @Get('api-usage')
 * @ApiUsageLog({
 *   trackCalls: true,
 *   trackErrors: true,
 *   trackResponseTime: true
 * })
 * async getApiUsageData() {
 *   // Endpoint with API usage logging
 * }
 * ```
 */
export const ApiUsageLog = (config: { trackCalls?: boolean; trackErrors?: boolean; trackResponseTime?: boolean }) =>
	SetMetadata('apiUsageLog', config);

/**
 * Set data access logging for endpoint
 * @param config Data access logging configuration
 * @returns Method decorator that sets data access logging
 * @example
 * ```typescript
 * @Get('sensitive-data')
 * @DataAccessLog({
 *   logReads: true,
 *   logWrites: true,
 *   includeData: false
 * })
 * async getSensitiveData() {
 *   // Endpoint with data access logging
 * }
 * ```
 */
export const DataAccessLog = (config: { logReads?: boolean; logWrites?: boolean; includeData?: boolean }) =>
	SetMetadata('dataAccessLog', config);
