/**
 * Credits System Types for EveryTriv
 * Shared between client and server
 *
 * @module CreditsTypes
 * @description Credits and balance management type definitions
 * @used_by server/src/features/credits/credits.service.ts, client/src/services/utils/credits.service.ts
 */
import { PaymentMethod } from '../constants';
import type { BaseEntity } from './core/data.types';

export interface CreditBalance {
	/**
	 * Total available credits from all sources: credits + purchasedCredits + freeQuestions
	 * This is the sum of all credit sources available for gameplay
	 */
	totalCredits: number;
	/**
	 * Base credits (earned through gameplay, admin adjustments, etc.)
	 * Separate from purchased credits and free questions
	 */
	credits: number;
	/**
	 * Credits purchased through payment
	 */
	purchasedCredits: number;
	/**
	 * Free questions remaining (daily reset)
	 */
	freeQuestions: number;
	/**
	 * Daily limit for free questions
	 */
	dailyLimit: number;
	/**
	 * Whether user can play for free (has free questions available)
	 */
	canPlayFree: boolean;
	/**
	 * Next reset time for free questions (ISO string)
	 */
	nextResetTime: string | null;
	/**
	 * User ID (optional, for admin operations)
	 */
	userId?: string;
	/**
	 * Balance alias for totalCredits (optional, for backward compatibility)
	 */
	balance?: number;
	/**
	 * Last modification timestamp
	 */
	lastModified?: Date;
}

export interface CreditPurchaseOption {
	id: string;
	credits: number;
	price: number;
	priceDisplay: string;
	pricePerCredit: number;
	description?: string;
	currency?: string;
	bonus?: number;
	savings?: string;
	popular?: boolean;
	paypalProductId?: string;
	paypalPrice?: string;
	supportedMethods?: PaymentMethod[];
}

/**
 * Base credits entity interface
 * @interface BaseCreditsEntity
 * @description Base interface for credits entities
 */
export interface BaseCreditsEntity extends BaseEntity {
	userId: string;
	amount: number;
	type: 'DAILY_RESET' | 'PURCHASE' | 'GAME_USAGE' | 'ADMIN_ADJUSTMENT' | 'REFUND';
	balanceAfter: number;
	description?: string;
}

/**
 * Credit transaction entity interface
 * @interface CreditTransaction
 * @description Entity for credit transactions
 * @used_by server/src/internal/entities/creditTransaction.entity.ts
 */
export interface CreditTransaction extends BaseCreditsEntity {
	freeQuestionsAfter: number;
	purchasedCreditsAfter: number;
	metadata: {
		difficulty?: string;
		topic?: string;
		questionsPerRequest?: number;
		requiredCredits?: number;
		packageId?: string;
		pricePerCredit?: number;
		originalAmount?: number;
		gameMode?: string;
		freeQuestionsUsed?: number;
		purchasedCreditsUsed?: number;
		creditsUsed?: number;
		reason?: string | null;
	};
}

/**
 * Transfer result interface
 * @interface TransferResult
 * @description Result of a credits transfer operation
 * @used_by server/src/features/credits/credits.service.ts (transferCredits)
 */
export interface TransferResult {
	success: boolean;
	fromBalance: CreditBalance;
	toBalance: CreditBalance;
	amount: number;
}

/**
 * Can play response interface
 * @interface CanPlayResponse
 * @description Response for checking if user can play
 * @used_by client/src/services/api.service.ts (canPlay), client/src/services/utils/credits.service.ts (canPlay)
 */
export interface CanPlayResponse {
	canPlay: boolean;
	reason?: string;
}
