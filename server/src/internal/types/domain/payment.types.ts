/**
 * Payment Types (server-only)
 * @module ServerPaymentTypes
 * @description Payment-related type definitions
 */
import { PayPalEnvironment } from '@shared/constants';
import type { PaymentMetadata } from '@shared/types';

/**
 * PayPal configuration interface
 * @interface PayPalConfig
 * @description PayPal payment gateway configuration
 */
export interface PayPalConfig {
	clientId: string;
	clientSecret: string;
	merchantId: string;
	environment: PayPalEnvironment;
}

/**
 * Personal payment data interface for payment forms (server-only)
 * @interface PersonalPaymentData
 * @description Payment data with personal information and full card details
 */
export interface PersonalPaymentData {
	firstName: string;
	lastName: string;
	email: string;
	cardNumber: string;
	expiryDate: string;
	cvv: string;
	cardHolderName: string;
	additionalInfo?: string;
	paymentMethod?: string;
	paypalOrderId?: string;
	paypalPaymentId?: string;
}

/**
 * Payment history metadata interface
 * @interface PaymentHistoryMetadata
 * @description Extended payment metadata for payment history entity
 * Extends shared PaymentMetadata with additional history-specific fields
 */
export interface PaymentHistoryMetadata extends PaymentMetadata {
	completedAt?: string;
	failedAt?: string;
	originalAmount?: number;
	originalCurrency?: string;
}
