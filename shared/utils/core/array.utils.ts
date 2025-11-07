/**
 * Core Array Utilities
 *
 * @module CoreArrayUtils
 * @description Basic array manipulation utilities shared between client and server
 */

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
