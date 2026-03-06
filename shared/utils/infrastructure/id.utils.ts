import { GENERATED_PAYMENT_INTENT_ID_PREFIX } from '@shared/constants';
import type { GeneratedPaymentIntentId } from '@shared/types';

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

function createGeneratedPaymentIntentId(suffix: string): GeneratedPaymentIntentId {
	return `${GENERATED_PAYMENT_INTENT_ID_PREFIX}${suffix}`;
}

export function generatePaymentIntentId(): GeneratedPaymentIntentId {
	return createGeneratedPaymentIntentId(generateId(20));
}
