import type { LogMeta } from '@shared/types';

import type { AudioKey } from '@/constants';

export type LogComponentErrorFn = (component: string, error: string, meta?: LogMeta) => void;
export type LogPaymentErrorFn = (paymentId: string, error: string, meta?: LogMeta) => void;
export type LogProviderErrorFn = (provider: string, error: string, meta?: LogMeta) => void;
export type LogProviderFn = (provider: string, meta?: LogMeta) => void;
export type LogResourceErrorFn = (resource: string, error: string, meta?: LogMeta) => void;

export interface ToastOptions {
	title: string;
	duration?: number;
	audioKey?: AudioKey;
}
