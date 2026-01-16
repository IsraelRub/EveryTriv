export enum PaymentStatus {
	PENDING = 'pending',
	COMPLETED = 'completed',
	FAILED = 'failed',
	REQUIRES_CAPTURE = 'requires_capture',
	REQUIRES_ACTION = 'requires_action',
}

export enum PaymentMethod {
	MANUAL_CREDIT = 'manual_credit',
	PAYPAL = 'paypal',
}

export enum PayPalEnvironment {
	PRODUCTION = 'production',
	SANDBOX = 'sandbox',
}

export enum PayPalOrderStatus {
	CREATED = 'CREATED',
	SAVED = 'SAVED',
	APPROVED = 'APPROVED',
	VOIDED = 'VOIDED',
	COMPLETED = 'COMPLETED',
	PAYER_ACTION_REQUIRED = 'PAYER_ACTION_REQUIRED',
}

export enum PayPalCaptureStatus {
	COMPLETED = 'COMPLETED',
	DECLINED = 'DECLINED',
	PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
	PENDING = 'PENDING',
	REFUNDED = 'REFUNDED',
}

export enum PaymentClientAction {
	COMPLETE = 'complete',
	MANUAL_CAPTURE = 'manual_capture',
	CONFIRM_PAYPAL = 'confirm_paypal',
}

export const MANUAL_CREDIT_SUPPORTED_CARD_LENGTHS = {
	MIN: 12,
	MAX: 19,
} as const;

export const VALID_PAYMENT_METHODS = Object.values(PaymentMethod);

export const VALID_PAYMENT_METHODS_SET = new Set<string>(VALID_PAYMENT_METHODS);

export enum PlanType {
	BASIC = 'basic',
	PREMIUM = 'premium',
	PRO = 'pro',
}

export const VALID_PLAN_TYPES = Object.values(PlanType);

export enum RequestSource {
	WEB = 'web',
	API = 'api',
}

export const CREDIT_PURCHASE_PACKAGES = [
	{ id: 'package_50', credits: 50, price: 2.99, tier: 'basic' },
	{ id: 'package_100', credits: 100, price: 4.99, tier: 'basic' },
	{ id: 'package_250', credits: 250, price: 9.99, tier: 'standard' },
	{ id: 'package_500', credits: 500, price: 18.99, tier: 'premium' },
	{ id: 'package_1000', credits: 1000, price: 34.99, tier: 'ultimate' },
	{ id: 'package_2000', credits: 2000, price: 64.99, tier: 'ultimate' },
].map(pkg => ({
	...pkg,
	paypalProductId: `everytriv_credits_${pkg.credits}`,
	paypalPrice: pkg.price.toFixed(2),
	supportedMethods: [PaymentMethod.MANUAL_CREDIT, PaymentMethod.PAYPAL],
	pricePerCredit: pkg.price / pkg.credits,
	priceDisplay: `$${pkg.price.toFixed(2)}`,
	currency: 'USD',
	bonus: 0,
}));

export const CREDIT_PURCHASE_PACKAGES_BY_ID = new Map<string, (typeof CREDIT_PURCHASE_PACKAGES)[number]>(
	CREDIT_PURCHASE_PACKAGES.map(pkg => [pkg.id, pkg])
);

export const CREDIT_PURCHASE_PACKAGES_BY_CREDITS = new Map<number, (typeof CREDIT_PURCHASE_PACKAGES)[number]>(
	CREDIT_PURCHASE_PACKAGES.map(pkg => [pkg.credits, pkg])
);

export const PAYPAL_API_BASE_URLS = {
	SANDBOX: 'https://api.sandbox.paypal.com',
	PRODUCTION: 'https://api.paypal.com',
} as const;

export const PAYPAL_API_ENDPOINTS = {
	OAUTH_TOKEN: '/v1/oauth2/token',
	ORDERS: '/v2/checkout/orders',
	WEBHOOK_VERIFY: '/v1/notifications/verify-webhook-signature',
} as const;

export const PAYPAL_ORDER_STATUSES = {
	CREATED: 'CREATED',
	SAVED: 'SAVED',
	APPROVED: 'APPROVED',
	VOIDED: 'VOIDED',
	COMPLETED: 'COMPLETED',
	PAYER_ACTION_REQUIRED: 'PAYER_ACTION_REQUIRED',
} as const;

export const PAYPAL_WEBHOOK_EVENTS = {
	PAYMENT_CAPTURE_COMPLETED: 'PAYMENT.CAPTURE.COMPLETED',
	PAYMENT_CAPTURE_DENIED: 'PAYMENT.CAPTURE.DENIED',
	PAYMENT_CAPTURE_REFUNDED: 'PAYMENT.CAPTURE.REFUNDED',
	PAYMENT_CAPTURE_PENDING: 'PAYMENT.CAPTURE.PENDING',
} as const;

export const PAYPAL_RETRY_CONFIG = {
	MAX_RETRIES: 3,
	INITIAL_DELAY_MS: 1000,
	MAX_DELAY_MS: 10000,
	BACKOFF_MULTIPLIER: 2,
} as const;
