import { PayPalEnvironment } from '@shared/constants';
import type { PaymentMetadata } from '@shared/types';

export interface PayPalConfig {
	clientId: string;
	clientSecret: string;
	merchantId: string;
	environment: PayPalEnvironment;
}

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

export interface PaymentHistoryMetadata extends PaymentMetadata {
	originalAmount?: number;
	originalCurrency?: string;
	paypalOrderStatus?: string;
	webhookEventId?: string;
}
