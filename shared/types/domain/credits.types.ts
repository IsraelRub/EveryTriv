// Credits System Types for EveryTriv.
import { CreditTransactionType as CreditTransactionTypeEnum, PaymentMethod } from '../../constants';
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
	userId: string;
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

export interface CanPlayResponse {
	canPlay: boolean;
	reason?: string;
}

export interface CreditsPurchaseRequest {
	packageId: string;
	paymentMethod: PaymentMethod;
	paypalOrderId?: string;
	paypalPaymentId?: string;
	manualPayment?: ManualPaymentDetails;
}

export interface UpdateCreditsData {
	userId: string;
	amount: number;
	reason: string;
}

export interface DeductCreditsResponse {
	success: boolean;
	credits: number;
	deducted: number;
}
