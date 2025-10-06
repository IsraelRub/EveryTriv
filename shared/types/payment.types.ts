/**
 * Payment Interfaces
 * @module PaymentInterfaces
 * @description Payment-related interfaces and types
 */
import type { UserAddress } from './domain/user/user.types';

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
	points?: number;
	bonus?: number;
	// Optional metadata fields
	created_at?: Date;
	updated_at?: Date;
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
	requestSource?: 'web' | 'mobile' | 'api';
	gatewayTransactionId?: string;
	refundReason?: string;
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
	paymentId?: string;
	transactionId?: string;
	status?: string;
	message?: string;
	amount?: number;
	currency?: string;
	error?: string;
}
