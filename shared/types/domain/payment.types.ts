/**
 * Payment Interfaces
 * @module PaymentInterfaces
 * @description Payment-related interfaces and types
 */
import {
	PaymentClientAction as PaymentClientActionEnum,
	PaymentMethod,
	PaymentStatus,
	PayPalEnvironment,
	PlanType,
	RequestSource,
} from '../../constants';

/**
 * Payment metadata interface
 * @interface PaymentMetadata
 * @description Metadata specific to payment operations
 */
export interface PaymentMetadata {
	subscriptionId?: string;
	plan?: string;
	planType?: string;
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
	requestSource?: RequestSource;
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

/**
 * Manual payment details interface (shared)
 * @interface ManualPaymentDetails
 * @description Payment card details for manual credit card payments
 */
export interface ManualPaymentDetails {
	cardNumber: string;
	expiryMonth: number;
	expiryYear: number;
	cvv: string;
	cardHolderName: string;
	expiryDate?: string;
	postalCode?: string;
}

/**
 * PayPal order request interface
 * @interface PayPalOrderRequest
 * @description Request for creating PayPal orders
 */
export interface PayPalOrderRequest {
	environment: PayPalEnvironment;
	clientId: string;
	currencyCode: string;
	amount: string;
	description?: string;
}

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
	clientAction: (typeof PaymentClientActionEnum)[keyof typeof PaymentClientActionEnum];
	paypalOrderRequest?: PayPalOrderRequest;
	paypalOrderId?: string;
	paypalPaymentId?: string;
	manualCaptureReference?: string;
	metadata?: PaymentMetadata;
}
