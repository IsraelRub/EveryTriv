// ID types for EveryTriv.
import {
	GENERATED_INTERCEPTOR_ID_PREFIX,
	GENERATED_PAYMENT_INTENT_ID_PREFIX,
	GENERATED_USER_ID_PREFIX,
} from '@shared/constants';

export type GeneratedUserId = `${typeof GENERATED_USER_ID_PREFIX}${string}`;

export type GeneratedPaymentIntentId = `${typeof GENERATED_PAYMENT_INTENT_ID_PREFIX}${string}`;

export type GeneratedInterceptorId = `${typeof GENERATED_INTERCEPTOR_ID_PREFIX}${string}`;

export type GeneratedId = GeneratedUserId | GeneratedPaymentIntentId | GeneratedInterceptorId;
