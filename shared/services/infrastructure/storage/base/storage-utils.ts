/**
 * Storage Utility Functions
 *
 * @module StorageUtils
 * @description utility functions for all storage services
 * @used_by shared/services/storage/services/baseStorage.service.ts, shared/services/storage
 */
import { STORAGE_ERROR_MESSAGES } from '@shared/constants';
import type { StorageOperationResult, StorageType, StorageValue, UserProgressData } from '@shared/types';
import { isRecord } from '@shared/utils';

/**
 * Storage Utility Functions
 * @class StorageUtils
 * @description Common utility functions for storage operations
 */
export class StorageUtils {
	/**
	 * Create success result
	 * @param data Operation data
	 * @param storageType Storage type
	 * @returns Success operation result
	 */
	static createSuccessResult<T>(data?: T, storageType: StorageType = 'persistent'): StorageOperationResult<T> {
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
	static createErrorResult<T>(error: string, storageType: StorageType = 'persistent'): StorageOperationResult<T> {
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
		} catch {
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
		} catch {
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
	 * Type guard to check if value is UserProgressData
	 * @param value Value to check
	 * @returns True if value is UserProgressData
	 */
	static isUserProgressData(value: StorageValue): value is UserProgressData {
		if (!isRecord(value)) {
			return false;
		}

		return (
			typeof value.userId === 'string' &&
			typeof value.topic === 'string' &&
			typeof value.correctAnswers === 'number' &&
			typeof value.totalQuestionsAnswered === 'number' &&
			typeof value.averageResponseTime === 'number' &&
			typeof value.lastPlayed === 'string' &&
			typeof value.difficulty === 'string'
		);
	}
}
