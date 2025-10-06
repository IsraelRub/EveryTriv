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
 */
export const AuditLog = (action: string) => SetMetadata('auditLog', { action });

/**
 * Set security logging for endpoint
 * @param level Security log level
 * @returns Method decorator that sets security logging
 */
export const SecurityLog = (level: 'low' | 'medium' | 'high' | 'critical') => SetMetadata('securityLog', { level });

/**
 * Set performance logging for endpoint
 * @param config Performance logging configuration
 * @returns Method decorator that sets performance logging
 */
export const PerformanceLog = (config: { trackDuration?: boolean; trackMemory?: boolean; alertThreshold?: number }) =>
	SetMetadata('performanceLog', config);

/**
 * Set error logging for endpoint
 * @param config Error logging configuration
 * @returns Method decorator that sets error logging
 */
export const ErrorLog = (config: { includeStack?: boolean; includeContext?: boolean; alertOnError?: boolean }) =>
	SetMetadata('errorLog', config);

/**
 * Set business logic logging for endpoint
 * @param category Business category
 * @returns Method decorator that sets business logging
 */
export const BusinessLog = (category: string) => SetMetadata('businessLog', { category });

/**
 * Set user activity logging for endpoint
 * @param activity Activity name
 * @returns Method decorator that sets user activity logging
 */
export const UserActivityLog = (activity: string) => SetMetadata('userActivityLog', { activity });

/**
 * Set API usage logging for endpoint
 * @param config API usage logging configuration
 * @returns Method decorator that sets API usage logging
 */
export const ApiUsageLog = (config: { trackCalls?: boolean; trackErrors?: boolean; trackResponseTime?: boolean }) =>
	SetMetadata('apiUsageLog', config);

/**
 * Set data access logging for endpoint
 * @param config Data access logging configuration
 * @returns Method decorator that sets data access logging
 */
export const DataAccessLog = (config: { logReads?: boolean; logWrites?: boolean; includeData?: boolean }) =>
	SetMetadata('dataAccessLog', config);
