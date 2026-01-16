import { StorageType } from '@shared/constants';
import type { StorageOperationResult } from '@shared/types';

export function createTimedResult<T>(
	success: boolean,
	data?: T,
	error?: string,
	startTime?: number,
	storageType: StorageType = StorageType.PERSISTENT
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
