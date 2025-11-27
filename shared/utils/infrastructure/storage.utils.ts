/**
 * Storage utility functions
 *
 * @module StorageUtils
 * @description Shared utility functions for storage operations
 * @used_by shared/services/storage
 */
import { StorageOperationResult, StorageType } from '@shared/types';

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
	storageType: StorageType = 'persistent'
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
