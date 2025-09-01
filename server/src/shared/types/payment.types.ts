/**
 * Payment-related types specific to the server
 * These types are used internally by the server and are not shared with the client
 *
 * @module ServerPaymentTypes
 * @description Server-specific payment metadata and internal types
 * @used_by server/src/shared/entities/paymentHistory.entity.ts, server/src/shared/entities/subscription.entity.ts, server/src/features/payment/dtos/
 */

// Payment metadata interface for server-side tracking
export interface PaymentMetadata {
	orderId?: string;
	customerId?: string;
	description?: string;
	source?: 'web' | 'mobile' | 'api';
	ipAddress?: string;
	userAgent?: string;
	referrer?: string;
	campaign?: string;
	affiliate?: string;
	customFields?: Record<string, string | number | boolean>;
}

// Subscription metadata interface for server-side tracking
export interface SubscriptionMetadata {
	planName?: string;
	billingCycle?: 'monthly' | 'yearly' | 'weekly';
	trialEnd?: string;
	cancelAtPeriodEnd?: boolean;
	promotionCode?: string;
	customFields?: Record<string, string | number | boolean>;
}

// Webhook metadata interface for server-side webhook processing
export interface WebhookMetadata {
	eventId?: string;
	eventType?: string;
	timestamp?: string;
	apiVersion?: string;
	livemode?: boolean;
	requestId?: string;
}
