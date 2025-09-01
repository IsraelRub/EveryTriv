/**
 * Storage utility functions
 *
 * @module StorageUtils
 * @description Shared utility functions for storage operations
 * @used_by shared/services/storage.service.ts, shared/services/storageManager.service.ts
 */
import { metricsService } from '../services/storage';
import { StorageMetrics, StorageOperationResult } from '../types/storage.types';

/**
 * Create operation result with timing
 * @param success Whether operation was successful
 * @param data Operation data
 * @param error Error message
 * @param startTime Operation start time
 * @param storageType Storage type
 * @returns Operation result with timing
 */
export function createTimedResult<T>(
	success: boolean,
	data?: T,
	error?: string,
	startTime?: number,
	storageType: 'persistent' | 'cache' | 'hybrid' = 'hybrid'
): StorageOperationResult<T> {
	const duration = startTime ? Date.now() - startTime : undefined;
	const result: StorageOperationResult<T> = {
		success,
		timestamp: new Date(),
		storageType,
	};

	if (data !== undefined) {
		result.data = data;
	}
	if (error) {
		result.error = error;
	}
	if (duration !== undefined) {
		result.duration = duration;
	}

	return result;
}

/**
 * Track operation with timing (shared utility)
 * @param operation Operation name
 * @param startTime Operation start time
 * @param success Whether operation was successful
 * @param storageType Storage type
 * @param size Data size in bytes (optional)
 * @param enableMetrics Whether to enable metrics tracking
 */
export function trackOperationWithTiming(
	operation: keyof StorageMetrics['operations'],
	startTime: number,
	success: boolean,
	storageType: 'persistent' | 'cache' | 'hybrid' = 'hybrid',
	size?: number,
	enableMetrics: boolean = true
): void {
	if (enableMetrics) {
		const duration = calculateDuration(startTime);
		metricsService.trackOperation(operation, storageType, success, duration, size);
	}
}

/**
 * Handle error with consistent formatting
 * @param error Error object
 * @returns Formatted error message
 */
export function formatStorageError(error: unknown): string {
	return error instanceof Error ? error.message : 'Unknown error';
}

/**
 * Calculate operation duration
 * @param startTime Operation start time
 * @returns Duration in milliseconds
 */
export function calculateDuration(startTime: number): number {
	return Date.now() - startTime;
}

/**
 * Validate storage key
 * @param key Storage key to validate
 * @returns Whether key is valid
 */
export function isValidStorageKey(key: string): boolean {
	return typeof key === 'string' && key.length > 0 && key.length <= 1024;
}

/**
 * Sanitize storage key
 * @param key Storage key to sanitize
 * @returns Sanitized key
 */
export function sanitizeStorageKey(key: string): string {
	return key.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 1024);
}

/**
 * Calculate data size in bytes
 * @param data Data to measure
 * @returns Size in bytes
 */
export function calculateDataSize(data: unknown): number {
	try {
		const serialized = JSON.stringify(data);
		return new Blob([serialized]).size;
	} catch {
		return 0;
	}
}

/**
 * Check if data size exceeds limit
 * @param data Data to check
 * @param maxSize Maximum size in bytes
 * @returns Whether data exceeds limit
 */
export function isDataSizeExceeded(data: unknown, maxSize: number): boolean {
	const size = calculateDataSize(data);
	return size > maxSize;
}
