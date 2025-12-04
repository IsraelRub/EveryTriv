/**
 * Core Data Utilities
 *
 * @module CoreDataUtils
 * @description Basic data manipulation utilities shared between client and server
 */

/**
 * Type guard to check if value is a record (object with string keys)
 * @param value Value to check
 * @returns True if value is a non-null object (not array)
 * @description Safely narrows unknown to Record<string, unknown> without type assertions
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Type guard to check if a record has a specific property
 * @param value Record to check
 * @param property Property name to check
 * @returns True if the record has the property
 * @description Safely checks if a property exists in a record
 */
export function hasProperty<K extends string>(value: unknown, property: K): value is Record<K, unknown> {
	return isRecord(value) && property in value;
}

/**
 * Type guard to check if a record has a property with a specific type
 * @param value Record to check
 * @param property Property name to check
 * @param typeGuard Type guard function to validate the property value
 * @returns True if the record has the property with the expected type
 * @description Safely checks if a property exists and matches a type guard
 */
export function hasPropertyOfType<K extends string, T>(
	value: unknown,
	property: K,
	typeGuard: (val: unknown) => val is T
): value is Record<K, T> & Record<string, unknown> {
	return hasProperty(value, property) && typeGuard(value[property]);
}

/**
 * Type guard to check if value is an array of strings
 * @param value Value to check
 * @returns True if value is an array where all items are strings
 * @description Safely narrows unknown to string[] without type assertions
 */
export function isStringArray(value: unknown): value is string[] {
	return Array.isArray(value) && value.every(item => typeof item === 'string');
}

/**
 * Calculate percentage with rounding
 * @param value Current value
 * @param total Total value
 * @returns Percentage as number (rounded to nearest integer)
 */
export function calculatePercentage(value: number, total: number): number {
	if (total === 0) return 0;

	const percentage = (value / total) * 100;
	return Math.round(percentage);
}

/**
 * Group array by key (in-memory)
 * @param arr Array to group (already loaded into memory)
 * @param key Key to group by
 * @returns Record mapping group key to array of items
 * @description Intended for in-memory grouping on already-loaded arrays.
 * For large datasets or DB-level aggregations, prefer createGroupByQuery
 * from server common queries.
 */
export function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
	const grouped: Record<string, T[]> = {};

	for (const item of arr) {
		const groupKey = String(item[key]);
		if (!grouped[groupKey]) {
			grouped[groupKey] = [];
		}
		grouped[groupKey].push(item);
	}

	return grouped;
}

/**
 * Build a count record from an array of items
 * @param items Items to aggregate
 * @param keySelector Selector for the record key
 * @param countSelector Selector for the numeric value
 * @returns Record mapping keys to numeric counts
 */
export function buildCountRecord<T>(
	items: T[],
	keySelector: (item: T) => string | null | undefined,
	countSelector: (item: T) => number | null | undefined
): Record<string, number> {
	const record: Record<string, number> = {};

	for (const item of items) {
		const key = keySelector(item);
		if (!key) {
			continue;
		}

		const value = countSelector(item);
		record[key] = Number(value ?? 0);
	}

	return record;
}

/**
 * Shuffle array using Fisher-Yates algorithm
 * @param arr Array to shuffle
 * @returns Shuffled array
 */
export function shuffle<T>(arr: T[]): T[] {
	const shuffled = [...arr];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}
