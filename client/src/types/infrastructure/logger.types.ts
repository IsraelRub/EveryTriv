import type { AudioKey } from '@/constants';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

/** Logger-only toast config. useToast uses AddToastOptions / ToastHelperProps (see types/ui/toast.types). */
export type ToastType = 'error' | 'warning' | 'success';

export interface ToastOptions {
	title: string;
	duration?: number;
	audioKey?: AudioKey;
}
