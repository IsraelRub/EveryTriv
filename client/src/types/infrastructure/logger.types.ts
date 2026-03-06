import type { AudioKey } from '@/constants';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export type ToastType = 'error' | 'warning' | 'success';

export interface ToastOptions {
	title: string;
	duration?: number;
	audioKey?: AudioKey;
}
