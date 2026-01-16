import {
	GENERATED_INTERCEPTOR_ID_PREFIX,
	GENERATED_PAYMENT_INTENT_ID_PREFIX,
	GENERATED_USER_ID_PREFIX,
} from '@shared/constants';
import type { GeneratedInterceptorId, GeneratedPaymentIntentId, GeneratedUserId } from '@shared/types';

export function generateId(length: number = 13): string {
	return Math.random()
		.toString(36)
		.substring(2, 2 + length);
}

export function generateTraceId(): string {
	return generateId(15) + generateId(15);
}

export function generateSessionId(): string {
	return Date.now().toString(36) + generateId(15);
}

function createGeneratedUserId(suffix: string): GeneratedUserId {
	return `${GENERATED_USER_ID_PREFIX}${suffix}`;
}

export function generateUserId(): GeneratedUserId {
	return createGeneratedUserId(generateId(10));
}

function createGeneratedPaymentIntentId(suffix: string): GeneratedPaymentIntentId {
	return `${GENERATED_PAYMENT_INTENT_ID_PREFIX}${suffix}`;
}

export function generatePaymentIntentId(): GeneratedPaymentIntentId {
	return createGeneratedPaymentIntentId(generateId(20));
}

function createGeneratedInterceptorIdWithDefault(timestamp: number, suffix: string): GeneratedInterceptorId {
	return `${GENERATED_INTERCEPTOR_ID_PREFIX}${timestamp}_${suffix}`;
}

function createGeneratedInterceptorIdWithCustom(prefix: string, timestamp: number, suffix: string): string {
	return `${prefix}${timestamp}_${suffix}`;
}

export function generateInterceptorId(): GeneratedInterceptorId;

export function generateInterceptorId(prefix: string): string;

export function generateInterceptorId(
	prefix: string = GENERATED_INTERCEPTOR_ID_PREFIX
): GeneratedInterceptorId | string {
	if (prefix === GENERATED_INTERCEPTOR_ID_PREFIX) {
		return createGeneratedInterceptorIdWithDefault(Date.now(), generateId(9));
	}
	return createGeneratedInterceptorIdWithCustom(prefix, Date.now(), generateId(9));
}
