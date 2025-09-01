/**
 * Server-only payment constants for EveryTriv
 */

// Re-export shared constants
export { PAYMENT_CONTENT,PAYMENT_FEATURES } from '../../../../shared/constants/payment.constants';

// Payment enums
export enum PaymentMethod {
	CREDIT_CARD = 'credit_card',
	DEBIT_CARD = 'debit_card',
	BANK_TRANSFER = 'bank_transfer',
	PAYPAL = 'paypal',
	CRYPTO = 'crypto',
}

export enum PaymentStatus {
	PENDING = 'pending',
	COMPLETED = 'completed',
	FAILED = 'failed',
	CANCELLED = 'cancelled',
	REFUNDED = 'refunded',
}

export enum PaymentType {
	PURCHASE = 'purchase',
	REFUND = 'refund',
	SUBSCRIPTION = 'subscription',
}
