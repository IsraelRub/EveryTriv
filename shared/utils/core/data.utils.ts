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
 * Calculate percentage with rounding
 * @param value Current value
 * @param total Total value
 * @param decimals Number of decimal places (default: 0)
 * @returns Percentage as number
 */
export function calculatePercentage(value: number, total: number, decimals: number = 0): number {
	try {
		if (total === 0) return 0;
		if (isNaN(value) || isNaN(total)) return 0;

		const percentage = (value / total) * 100;
		return decimals === 0
			? Math.round(percentage)
			: Math.round(percentage * Math.pow(10, decimals)) / Math.pow(10, decimals);
	} catch {
		return 0;
	}
}

/**
 * Get unique values from array
 * @param arr Array to get unique values from
 * @returns Array with unique values
 */
export function unique<T>(arr: T[]): T[] {
	return [...new Set(arr)];
}

/**
 * Group array by key
 * @param arr Array to group
 * @param key Key to group by
 * @returns Grouped array
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
