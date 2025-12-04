/**
 * Payment Interfaces
 * @module PaymentInterfaces
 * @description Payment-related interfaces and types
 */
import { PaymentMethod, PaymentStatus, PAYPAL_ENVIRONMENTS, PlanType } from '../constants';

/**
 * Payment metadata interface
 * @interface PaymentMetadata
 * @description Metadata specific to payment operations
 */
// Payment metadata is now self-contained without server-specific metadata

export interface PaymentMetadata {
	subscriptionId?: string;
	plan?: string;
	planType?: string;
	billingCycle?: string;
	price?: number;
	currency?: string;
	paymentMethod?: string;
	userId?: string;
	transactionId?: string;
	status?: string;
	optionId?: string;
	packageId?: string;
	credits?: number;
	bonus?: number;
	// Optional metadata fields
	createdAt?: Date;
	updatedAt?: Date;
	version?: string;
	source?: string;
	tags?: string[];
	requestId?: string;
	ipAddress?: string;
	userAgent?: string;
	referrer?: string;
	campaign?: string;
	affiliate?: string;
	apiVersion?: string;
	requestSource?: 'web' | 'api';
	gatewayTransactionId?: string;
	refundReason?: string;
	paypalOrderId?: string;
	paypalPaymentId?: string;
	paypalTransactionId?: string;
	paypalMerchantId?: string;
	manualCaptureReference?: string;
	cardLast4?: string;
	cardBrand?: string;
	cardExpirationMonth?: number;
	cardExpirationYear?: number;
}

// Personal payment data interface for payment forms
export interface PersonalPaymentData {
	// Personal Information
	firstName: string;
	lastName: string;
	email: string;

	// Payment Information
	cardNumber: string;
	expiryDate: string;
	cvv: string;
	cardHolderName: string;

	// Plan Information
	planType: PlanType;
	numberOfPayments: number;

	// Additional
	additionalInfo?: string;
	agreeToTerms: boolean;
	paymentMethod?: PaymentMethod;
	paypalOrderId?: string;
	paypalPaymentId?: string;
}

export interface ManualPaymentDetails {
	cardNumber: string;
	expiryMonth: number;
	expiryYear: number;
	cvv: string;
	cardHolderName: string;
	email?: string;
	agreeToTerms?: boolean;
	expiryDate?: string;
	postalCode?: string;
}

export type PayPalEnvironment = (typeof PAYPAL_ENVIRONMENTS)[keyof typeof PAYPAL_ENVIRONMENTS];

export interface PayPalOrderRequest {
	environment: PayPalEnvironment;
	clientId: string;
	currencyCode: string;
	amount: string;
	description?: string;
}

export type PaymentClientAction = 'complete' | 'manual_capture' | 'confirm_paypal';

// Payment data for creating payments (shared between client and server)
export interface PaymentData {
	amount: number;
	currency: string;
	description: string;
	method: PaymentMethod;
	planType?: PlanType;
	numberOfPayments?: number;
	type?: string;
	manualPayment?: ManualPaymentDetails;
	paypalOrderId?: string;
	paypalPaymentId?: string;
	clientTransactionId?: string;
	metadata?: PaymentMetadata;
}

// Payment result (shared between client and server)
export interface PaymentResult {
	paymentId?: string;
	transactionId?: string;
	status: PaymentStatus;
	message?: string;
	amount?: number;
	currency?: string;
	error?: string;
	paymentMethod: PaymentMethod;
	clientAction: PaymentClientAction;
	paypalOrderRequest?: PayPalOrderRequest;
	paypalOrderId?: string;
	paypalPaymentId?: string;
	manualCaptureReference?: string;
	metadata?: PaymentMetadata;
}
