/**
 * Core Math Utilities
 *
 * @module CoreMathUtils
 * @description Basic mathematical utilities shared between client and server
 */

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
	} catch {
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
	} catch {
		return 0;
	}
}
