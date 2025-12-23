/**
 * Storage Utility Functions
 *
 * @module StorageUtils
 * @description utility functions for all storage services
 * @used_by server/src/internal/modules/storage/storage.service.ts
 */
import { ERROR_MESSAGES, StorageType } from '@shared/constants';
import type { StorageOperationResult } from '@shared/types';

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
	static createSuccessResult<T>(
		data?: T,
		storageType: StorageType = StorageType.PERSISTENT
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
		storageType: StorageType = StorageType.PERSISTENT
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
		} catch {
			throw new Error(ERROR_MESSAGES.storage.SERIALIZATION_FAILED);
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
			throw new Error(ERROR_MESSAGES.storage.DESERIALIZATION_FAILED);
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
}
