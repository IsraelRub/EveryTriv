/**
 * Payment-related types shared between client and server
 *
 * @module PaymentTypes
 * @description Payment and subscription type definitions
 * @used_by server: server/src/features/payment/services/payment.service.ts (PaymentService), client: client/src/views/payment/PaymentView.tsx (PaymentView), shared/services/storage.service.ts (payment data storage)
 */
import { UserAddress } from './user.types';

// Payment status enum (shared between client and server)
export enum PaymentStatus {
	SUCCEEDED = 'succeeded',
	PENDING = 'pending',
	FAILED = 'failed',
	CANCELLED = 'cancelled',
}

// Payment method enum (shared between client and server)
export enum PaymentMethod {
	STRIPE = 'stripe',
	PAYPAL = 'paypal',
	MANUAL = 'manual',
}

// Subscription status enum (shared between client and server)
export enum SubscriptionStatus {
	ACTIVE = 'active',
	PENDING = 'pending',
	CANCELLED = 'cancelled',
	EXPIRED = 'expired',
	PAST_DUE = 'past_due',
	UNPAID = 'unpaid',
}

// Payment type enum (shared between client and server)
export enum PaymentType {
	SUBSCRIPTION = 'subscription',
	POINTS_PURCHASE = 'points_purchase',
	ONE_TIME = 'one_time',
}

/**
 * Payment metadata interface
 * @interface PaymentMetadata
 * @description Metadata specific to payment operations
 */
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
	points?: number;
	bonus?: number;
}

// Personal payment data interface for payment forms
export interface PersonalPaymentData {
	// Personal Information
	first_name: string;
	last_name: string;
	email: string;
	phone: string;
	date_of_birth: string;

	// Address Information
	address: UserAddress;

	// Payment Information
	cardNumber: string;
	expiryDate: string;
	cvv: string;
	cardHolderName: string;

	// Plan Information
	planType: 'basic' | 'premium' | 'pro' | 'points';
	numberOfPayments: number;

	// Additional
	additional_info?: string;
	agreeToTerms: boolean;
}

// Payment data for creating payments (shared between client and server)
export interface PaymentData {
	amount: number;
	currency: string;
	description: string;
	planType?: string;
	numberOfPayments?: number;
	type?: string;
	metadata?: PaymentMetadata;
}

// Payment result (shared between client and server)
export interface PaymentResult {
	success: boolean;
	paymentId?: string;
	transactionId?: string;
	status?: string;
	message?: string;
	amount?: number;
	currency?: string;
	error?: string;
}
