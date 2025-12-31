/**
 * Server Domain Constants
 */

/**
 * Credit Source Enum (server-only)
 */
export enum CreditSource {
	FREE_DAILY = 'FREE_DAILY',
	PURCHASED = 'PURCHASED',
	BONUS = 'BONUS',
}

/**
 * UUID validation regex pattern
 * Matches standard UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 */
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
