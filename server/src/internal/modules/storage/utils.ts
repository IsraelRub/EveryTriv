import { ERROR_MESSAGES, StorageType } from '@shared/constants';
import type { StorageOperationResult } from '@shared/types';

export class StorageUtils {
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

	static serialize<T>(value: T): string {
		try {
			return JSON.stringify(value);
		} catch {
			throw new Error(ERROR_MESSAGES.storage.SERIALIZATION_FAILED);
		}
	}

	static deserialize<T>(data: string): T {
		try {
			return JSON.parse(data);
		} catch {
			throw new Error(ERROR_MESSAGES.storage.DESERIALIZATION_FAILED);
		}
	}

	static getPrefixedKey(key: string, prefix: string): string {
		return `${prefix}${key}`;
	}
}
