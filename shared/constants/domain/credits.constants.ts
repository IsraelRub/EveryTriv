/**
 * Credits Constants for EveryTriv
 *
 * @module CreditsConstants
 * @description Credits-related enums and constants shared between client and server
 * @used_by server/src/features/credits, client/src/services/credits, shared/types
 */

/**
 * Credit Transaction Type Enum
 * @enum CreditTransactionType
 * @description Types of credit transactions
 * @used_by server/src/features/credits, shared/types/domain/credits.types.ts
 */
export enum CreditTransactionType {
	DAILY_RESET = 'DAILY_RESET',
	PURCHASE = 'PURCHASE',
	GAME_USAGE = 'GAME_USAGE',
	ADMIN_ADJUSTMENT = 'ADMIN_ADJUSTMENT',
	REFUND = 'REFUND',
}

/**
 * Credit Source Enum
 * @enum CreditSource
 * @description Sources of credit transactions
 * @used_by server/src/features/credits, shared/types/domain/credits.types.ts
 */
export enum CreditSource {
	FREE_DAILY = 'FREE_DAILY',
	PURCHASED = 'PURCHASED',
	BONUS = 'BONUS',
	REFUND = 'REFUND',
}
