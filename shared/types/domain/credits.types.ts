/**
 * Credits System Types for EveryTriv
 * Shared between client and server
 *
 * @module CreditsTypes
 * @description Credits and balance management type definitions
 */
import {
	CreditTransactionType,
	CreditTransactionType as CreditTransactionTypeEnum,
	PaymentMethod,
} from '../../constants';
import type { BaseTimestamps } from '../core/data.types';
import type { ManualPaymentDetails } from './payment.types';

export interface CreditBalance {
	totalCredits: number;
	credits: number;
	purchasedCredits: number;
	freeQuestions: number;
	dailyLimit: number;
	canPlayFree: boolean;
	nextResetTime: string | null;
	userId?: string;
	balance?: number;
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
 * Credit transaction interface (shared - used in API responses)
 * @interface CreditTransaction
 * @description Credit transaction data structure
 */
export interface CreditTransaction extends BaseTimestamps {
	id: string;
	userId: string;
	amount: number;
	type: (typeof CreditTransactionTypeEnum)[keyof typeof CreditTransactionTypeEnum];
	balanceAfter: number;
	description?: string;
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
 * Base credits entity interface
 * @interface BaseCreditsEntity
 * @description Base interface for credits entities
 */
export interface BaseCreditsEntity {
	id: string;
	userId: string;
	amount: number;
	type: CreditTransactionType;
	balanceAfter: number;
	description?: string;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Can play response interface
 * @interface CanPlayResponse
 * @description Response for checking if user can play
 */
export interface CanPlayResponse {
	canPlay: boolean;
	reason?: string;
}

/**
 * Transfer result interface
 * @interface TransferResult
 * @description Result of a credits transfer operation
 */
export interface TransferResult {
	success: boolean;
	fromBalance: CreditBalance;
	toBalance: CreditBalance;
	amount: number;
}

/**
 * Credits purchase request interface
 * @interface CreditsPurchaseRequest
 * @description Request payload for purchasing credits
 */
export interface CreditsPurchaseRequest {
	packageId: string;
	paymentMethod: PaymentMethod;
	paypalOrderId?: string;
	paypalPaymentId?: string;
	manualPayment?: ManualPaymentDetails;
}
