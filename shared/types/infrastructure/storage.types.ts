// Storage-related types for EveryTriv.
import { StorageType } from '@shared/constants';

export interface StorageOperationResult<T = unknown> {
	success: boolean;
	data?: T;
	error?: string;
	timestamp: Date;
	duration?: number;
	storageType?: StorageType;
}
