import { TIME_DURATIONS_SECONDS } from '../core/time.constants';

export const STORAGE_CONFIG = {
	PREFIX: 'everytriv_',
	DEFAULT_TTL: TIME_DURATIONS_SECONDS.HOUR,
	MAX_SIZE: 5 * 1024 * 1024, // 5MB
	ENABLE_COMPRESSION: false,
	ENABLE_METRICS: true,
} as const;

export enum StorageType {
	PERSISTENT = 'persistent',
	CACHE = 'cache',
}
