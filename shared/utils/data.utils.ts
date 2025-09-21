/**
 * Shared data manipulation utilities for EveryTriv
 * Used by both client and server for array and object operations
 *
 * @module DataUtils
 * @description Data transformation and manipulation utilities
 * @used_by server/src/features/game/game.service.ts, client/src/views/gameHistory, server/src/features/game/logic/providers/management
 */

/**
 * Shuffle array using Fisher-Yates algorithm
 * @param array Array to shuffle
 * @returns Shuffled array
 */
export function shuffle<T>(array: T[]): T[] {
	const shuffled = [...array];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}

/**
 * Deep clone an object
 * @param obj Object to clone
 * @returns Deep cloned object
 */
export function deepClone<T>(obj: T): T {
	if (obj === null || typeof obj !== 'object') return obj;
	if (obj instanceof Date) return new Date(obj.getTime()) as T;
	if (obj instanceof Array) return obj.map(item => deepClone(item)) as T;
	if (typeof obj === 'object') {
		const clonedObj = {} as T;
		for (const key in obj) {
			if (Object.prototype.hasOwnProperty.call(obj, key)) {
				clonedObj[key] = deepClone(obj[key]);
			}
		}
		return clonedObj;
	}
	return obj;
}

/**
 * Get unique values from array
 * @param array Array to get unique values from
 * @returns Array with unique values
 */
export function unique<T>(array: T[]): T[] {
	return [...new Set(array)];
}

/**
 * Group array by key
 * @param array Array to group
 * @param key Key to group by
 * @returns Grouped array
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
	return array.reduce(
		(groups, item) => {
			const groupKey = String(item[key]);
			if (!groups[groupKey]) {
				groups[groupKey] = [];
			}
			groups[groupKey].push(item);
			return groups;
		},
		{} as Record<string, T[]>
	);
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
	} catch (error) {
		return 0;
	}
}

/**
 * Clamp value between min and max
 * @param value Value to clamp
 * @param min Minimum value
 * @param max Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
	try {
		if (isNaN(value) || isNaN(min) || isNaN(max)) return min;
		return Math.max(min, Math.min(max, value));
	} catch (error) {
		return min;
	}
}

/**
 * Round number to specified decimal places
 * @param value Number to round
 * @param decimals Number of decimal places (default: 0)
 * @returns Rounded number
 */
export function roundToDecimals(value: number, decimals: number = 0): number {
	try {
		if (isNaN(value) || isNaN(decimals)) return 0;
		return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
	} catch (error) {
		return 0;
	}
}
