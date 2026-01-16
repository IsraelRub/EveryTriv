import {
	GENERATED_INTERCEPTOR_ID_PREFIX,
	GENERATED_PAYMENT_INTENT_ID_PREFIX,
	GENERATED_USER_ID_PREFIX,
} from '@shared/constants';
import type { GeneratedInterceptorId, GeneratedPaymentIntentId, GeneratedUserId } from '@shared/types';

export function isGeneratedUserId(value: string): value is GeneratedUserId {
	return value.startsWith(GENERATED_USER_ID_PREFIX);
}

export function isGeneratedPaymentIntentId(value: string): value is GeneratedPaymentIntentId {
	return value.startsWith(GENERATED_PAYMENT_INTENT_ID_PREFIX);
}

export function isGeneratedInterceptorId(value: string): value is GeneratedInterceptorId {
	return value.startsWith(GENERATED_INTERCEPTOR_ID_PREFIX);
}
