// Credits System Types for EveryTriv.
import { PaymentMethod, type PurchaseCurrency } from '../../constants';
import type { ManualPaymentDetails } from './payment.types';

export interface CreditBalance {
	totalCredits: number;
	credits: number;
	purchasedCredits: number;

	nextGrantedCreditsRefillAt: string | null;
	userId: string;
}

export interface CreditPurchaseOption {
	id: string;
	credits: number;
	price: number;

	priceIls: number;
	priceDisplay: string;
	priceDisplayIls?: string;
	pricePerCredit: number;
	pricePerCreditIls?: number;
	description?: string;
	currency?: string;
	bonus?: number;
	savings?: string;
	popular?: boolean;
	paypalProductId?: string;
	paypalPrice?: string;
	paypalPriceIls?: string;
	supportedMethods?: PaymentMethod[];
}

export interface CanPlayResponse {
	canPlay: boolean;
	reason?: string;
}

export interface CreditsPurchaseRequest {
	packageId: string;
	paymentMethod: PaymentMethod;

	currency?: PurchaseCurrency;
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
