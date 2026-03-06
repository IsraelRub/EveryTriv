import { GENERATED_PAYMENT_INTENT_ID_PREFIX } from '@shared/constants';

export type GeneratedPaymentIntentId = `${typeof GENERATED_PAYMENT_INTENT_ID_PREFIX}${string}`;
