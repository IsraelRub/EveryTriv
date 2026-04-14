export enum PaymentTab {
	CREDITS = 'credits',
	PAYMENT_HISTORY = 'payment-history',
}

/**
 * Manual card payment is a dev/simulation path on the server (no real capture).
 * Shown in Vite `development` mode, or when `VITE_ENABLE_MANUAL_CREDIT_PAYMENT=true` (e.g. staging).
 */
export function isManualCreditPaymentMethodEnabledInClient(): boolean {
	return import.meta.env.VITE_ENABLE_MANUAL_CREDIT_PAYMENT === 'true' || import.meta.env.MODE === 'development';
}
