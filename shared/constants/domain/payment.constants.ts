/**
 * Payment and Subscription Constants for EveryTriv
 *
 * @module PaymentConstants
 * @description Payment-related enums and constants shared between client and server
 * @used_by server/src/features/payment, client/src/views/payment, shared/types
 */

/**
 * Payment Status Enum
 * @enum PaymentStatus
 * @description Payment transaction statuses
 * @used_by server/src/features/payment, shared/types/domain/payment.types.ts
 */
export enum PaymentStatus {
	PENDING = 'pending',
	COMPLETED = 'completed',
	FAILED = 'failed',
	REQUIRES_CAPTURE = 'requires_capture',
	REQUIRES_ACTION = 'requires_action',
}

/**
 * Payment Method Enum
 * @enum PaymentMethod
 * @description Supported payment methods
 * @used_by server/src/features/payment, shared/types/domain/payment.types.ts
 */
export enum PaymentMethod {
	MANUAL_CREDIT = 'manual_credit',
	PAYPAL = 'paypal',
}

export const PAYPAL_ENVIRONMENTS = {
	PRODUCTION: 'production',
	SANDBOX: 'sandbox',
} as const;

export const MANUAL_CREDIT_SUPPORTED_CARD_LENGTHS = {
	MIN: 12,
	MAX: 19,
} as const;

export const VALID_PAYMENT_METHODS = Object.values(PaymentMethod);

/**
 * Subscription Status Enum
 * @enum SubscriptionStatus
 * @description Subscription statuses
 * @used_by server/src/features/payment, shared/types/domain/subscription.types.ts
 */
export enum SubscriptionStatus {
	ACTIVE = 'active',
	CANCELLED = 'cancelled',
	PENDING = 'pending',
}

/**
 * Plan Type Enum
 * @enum PlanType
 * @description Subscription plan types
 * @used_by server/src/features/subscription, server/src/features/payment, shared/types
 */
export enum PlanType {
	BASIC = 'basic',
	PREMIUM = 'premium',
	PRO = 'pro',
}

/**
 * Array of all valid plan types
 * @constant
 * @description Complete list of supported plan types
 * @used_by server/src/validation, client/forms, server/src/features/subscription
 */
export const VALID_PLAN_TYPES = Object.values(PlanType);

/**
 * Billing Cycle Enum
 * @enum BillingCycle
 * @description Billing cycle options for subscriptions
 * @used_by server/src/features/subscription, server/src/features/payment, shared/types
 */
export enum BillingCycle {
	MONTHLY = 'monthly',
	YEARLY = 'yearly',
}

/**
 * Array of all valid billing cycles
 * @constant
 * @description Complete list of supported billing cycles
 * @used_by server/src/validation, client/forms, server/src/features/subscription
 */
export const VALID_BILLING_CYCLES = Object.values(BillingCycle);

/**
 * Point packages - single source of truth
 * @constant
 * @description All point packages with consistent pricing
 * @used_by server/src/features/payment, client/src/views/payment
 */
export const POINT_PURCHASE_PACKAGES = [
	{ id: 'package_50', points: 50, price: 2.99, tier: 'basic' },
	{ id: 'package_100', points: 100, price: 4.99, tier: 'basic' },
	{ id: 'package_250', points: 250, price: 9.99, tier: 'standard' },
	{ id: 'package_500', points: 500, price: 18.99, tier: 'premium' },
	{ id: 'package_1000', points: 1000, price: 34.99, tier: 'ultimate' },
	{ id: 'package_2000', points: 2000, price: 64.99, tier: 'ultimate' },
].map(pkg => ({
	...pkg,
	paypalProductId: `everytriv_points_${pkg.points}`,
	paypalPrice: pkg.price.toFixed(2),
	supportedMethods: [PaymentMethod.MANUAL_CREDIT, PaymentMethod.PAYPAL],
	pricePerPoint: pkg.price / pkg.points,
	priceDisplay: `$${pkg.price.toFixed(2)}`,
}));

/**
 * Subscription pricing plans
 * @constant
 * @description Available subscription plans and pricing
 * @used_by server/src/features/payment, client/src/views/payment
 */
export const SUBSCRIPTION_PLANS = {
	basic: {
		price: 9.99,
		currency: 'USD',
		interval: 'month',
		features: ['Unlimited trivia questions', 'Basic analytics', 'Email support'],
		pointBonus: 100,
		questionLimit: 1000,
		paypalProductId: 'everytriv_subscription_basic',
		supportedMethods: [PaymentMethod.MANUAL_CREDIT, PaymentMethod.PAYPAL],
	},
	premium: {
		price: 19.99,
		currency: 'USD',
		interval: 'month',
		features: [
			'Unlimited trivia questions',
			'Advanced analytics',
			'Priority support',
			'Custom difficulty levels',
			'Export functionality',
		],
		pointBonus: 250,
		questionLimit: -1,
		paypalProductId: 'everytriv_subscription_premium',
		supportedMethods: [PaymentMethod.MANUAL_CREDIT, PaymentMethod.PAYPAL],
	},
	pro: {
		name: 'Pro Plan',
		price: 39.99,
		currency: 'USD',
		interval: 'month',
		features: [
			'Everything in Premium',
			'API access',
			'White-label options',
			'Dedicated support',
			'Custom integrations',
		],
		pointBonus: 500,
		questionLimit: -1,
		paypalProductId: 'everytriv_subscription_pro',
		supportedMethods: [PaymentMethod.MANUAL_CREDIT, PaymentMethod.PAYPAL],
	},
} as const;
