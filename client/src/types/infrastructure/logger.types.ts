import type { AudioKey } from '@/constants';

export type ToastType = 'error' | 'warning' | 'success';
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface ToastOptions {
	title: string;
	duration?: number;
	audioKey?: AudioKey;
}
