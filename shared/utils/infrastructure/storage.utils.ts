/**
 * Storage utility functions
 *
 * @module StorageUtils
 * @description Shared utility functions for storage operations
 * @used_by shared/services/storage
 */
import { StorageOperationResult } from '@shared/types';

import { getErrorMessage } from '../core/error.utils';

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
 * Handle error with consistent formatting
 * @param error Error object
 * @returns Formatted error message
 */
export function formatStorageError(error: unknown): string {
	return getErrorMessage(error);
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
export function isValidStorageKey(key: unknown): key is string {
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
		return Buffer.byteLength(serialized, 'utf8');
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
