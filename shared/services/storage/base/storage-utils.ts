/**
 * Storage Utility Functions
 *
 * @module StorageUtils
 * @description Unified utility functions for all storage services
 * @used_by shared/services/storage/services/baseStorage.service.ts, shared/services/storage/services/storageManager.service.ts
 */
import { STORAGE_ERROR_MESSAGES } from '../../../constants/core/error.constants';
import { StorageOperationResult } from '../../../types/infrastructure/storage.types';

// Logger is optional - will be used if available
let logger: { storageError: (message: string, meta?: Record<string, unknown>) => void } | null = null;
try {
	// Check if we're in a browser environment
	if (typeof globalThis !== 'undefined' && 'window' in globalThis) {
		// Client-side: try to import client logger
		const loggerModule = require('../../logging');
		logger = loggerModule.clientLogger;
	} else {
		// Server-side: try to import server logger
		const loggerModule = require('../../logging');
		logger = loggerModule.serverLogger;
	}
} catch {
	// Logger not available - continue without logging
}

/**
 * Storage Utility Functions
 * @class StorageUtils
 * @description Common utility functions for storage operations
 */
export class StorageUtils {
	/**
	 * Create operation result with timing
	 * @param success Whether operation was successful
	 * @param data Operation data
	 * @param error Error message
	 * @param startTime Operation start time
	 * @param storageType Storage type
	 * @returns Operation result with timing
	 */
	static createTimedResult<T>(
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
	 * Create success result
	 * @param data Operation data
	 * @param storageType Storage type
	 * @returns Success operation result
	 */
	static createSuccessResult<T>(
		data?: T,
		storageType: 'persistent' | 'cache' | 'hybrid' = 'persistent'
	): StorageOperationResult<T> {
		return {
			success: true,
			data,
			timestamp: new Date(),
			storageType,
		};
	}

	/**
	 * Create error result
	 * @param error Error message
	 * @param storageType Storage type
	 * @returns Error operation result
	 */
	static createErrorResult<T>(
		error: string,
		storageType: 'persistent' | 'cache' | 'hybrid' = 'persistent'
	): StorageOperationResult<T> {
		return {
			success: false,
			error,
			timestamp: new Date(),
			storageType,
		};
	}

	/**
	 * Serialize value to JSON string
	 * @param value Value to serialize
	 * @returns Serialized string
	 */
	static serialize<T>(value: T): string {
		try {
			return JSON.stringify(value);
		} catch (error) {
			if (logger && logger.storageError) {
				logger.storageError('Failed to serialize value', {
					error: error instanceof Error ? error.message : 'Unknown error',
				});
			}
			throw new Error(STORAGE_ERROR_MESSAGES.SERIALIZATION_FAILED);
		}
	}

	/**
	 * Deserialize JSON string to value
	 * @param data JSON string to deserialize
	 * @returns Deserialized value
	 */
	static deserialize<T>(data: string): T {
		try {
			return JSON.parse(data);
		} catch (error) {
			if (logger && logger.storageError) {
				logger.storageError('Failed to deserialize data', {
					error: error instanceof Error ? error.message : 'Unknown error',
				});
			}
			throw new Error(STORAGE_ERROR_MESSAGES.DESERIALIZATION_FAILED);
		}
	}

	/**
	 * Get prefixed key
	 * @param key Original key
	 * @param prefix Key prefix
	 * @returns Prefixed key
	 */
	static getPrefixedKey(key: string, prefix: string): string {
		return `${prefix}${key}`;
	}

	/**
	 * Format storage error
	 * @param error Error object
	 * @returns Formatted error message
	 */
	static formatError(error: unknown): string {
		return error instanceof Error ? error.message : 'Unknown error';
	}

	/**
	 * Calculate operation duration
	 * @param startTime Operation start time
	 * @returns Duration in milliseconds
	 */
	static calculateDuration(startTime: number): number {
		return Date.now() - startTime;
	}
}
