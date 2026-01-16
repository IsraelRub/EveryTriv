export type TypeGuard<T> = (value: unknown) => value is T;

export type BasicValue = string | number | boolean;

export type StatsValue = BasicValue | Date | Record<string, BasicValue | Date>;

export type StorageValue = BasicValue | Record<string, unknown> | BasicValue[] | unknown[] | Date | null | object;

export type RequestData = StorageValue | unknown;

export type BaseDataValue = BasicValue | string[] | Date;

export type BaseData = Record<string, BaseDataValue>;

export interface BaseTimestamps {
	createdAt: Date;
	updatedAt: Date;
}

export interface BaseEntity extends BaseTimestamps {
	id: string;
}

export interface BaseCacheEntry extends BaseTimestamps {
	lastAccessed: Date;
}

export interface SlowOperation {
	operation: string;

	duration: number;

	timestamp: Date;

	metadata?: Record<string, BasicValue>;
}

export interface SelectOption {
	value: string;
	label: string;
}

export interface ActivityEntry {
	date: string;

	action: string;

	detail?: string;

	topic?: string;

	durationSeconds?: number;
}

export type CountRecord = Record<string, number>;

export interface TotalCorrectStats {
	total: number;
	correct: number;
}

export interface DifficultyStats extends TotalCorrectStats {
	successRate?: number;
}

export interface DifficultyStatsRaw extends TotalCorrectStats {
	difficulty: string;
}

export type DifficultyBreakdown = Record<string, DifficultyStats>;

export interface TextPosition {
	start: number;
	end: number;
}
