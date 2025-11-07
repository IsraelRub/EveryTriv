import { useCallback, useEffect, useRef, useState } from 'react';

import type { SubscriptionPlansProps } from '@/types';

/**
 * Hook to debounce a value
 * @param value The value to debounce
 * @param delay The delay in milliseconds
 * @returns The debounced value
 */

export function useDebounce<T>(value: T, delay: number): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value);

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		return () => {
			clearTimeout(handler);
		};
	}, [value, delay]);

	return debouncedValue;
}

/**
 * Hook to debounce a function with enhanced functionality
 * @param func The function to debounce
 * @param delay The delay in milliseconds
 * @param options Additional options for debouncing
 * @returns Object with debounced function and control methods
 */
type PlanSelectCallback = NonNullable<SubscriptionPlansProps['onPlanSelect']>;

interface DebouncedCallbackControls {
	debounced: PlanSelectCallback;
	cancel: () => void;
	flush: () => void;
	isPending: boolean;
}

export function useDebouncedCallback(
	func: PlanSelectCallback,
	delay: number,
	options: {
		leading?: boolean;
		trailing?: boolean;
		maxWait?: number;
	} = {}
): DebouncedCallbackControls {
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const lastCallTimeRef = useRef<number>(0);
	const lastArgsRef = useRef<Parameters<PlanSelectCallback> | null>(null);
	const [isPending, setIsPending] = useState(false);

	const { leading = false, trailing = true, maxWait } = options;

	const cancel = useCallback(() => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}
		lastArgsRef.current = null;
		setIsPending(false);
	}, []);

	const flush = useCallback((): void => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}
		setIsPending(false);
		const args = lastArgsRef.current;
		lastArgsRef.current = null;
		if (args) {
			lastCallTimeRef.current = Date.now();
			func(...args);
		}
	}, [func]);

	const debounced = useCallback(
		function debouncedFn(...args: Parameters<PlanSelectCallback>): void {
			const now = Date.now();
			const timeSinceLastCall = now - lastCallTimeRef.current;
			lastArgsRef.current = args;

			// Leading edge execution
			if (leading && !timeoutRef.current) {
				lastCallTimeRef.current = now;
				setIsPending(true);
				func(...args);
				lastArgsRef.current = null;
				setIsPending(false);
				return;
			}

			// Cancel existing timeout
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}
			setIsPending(false);

			// Check if maxWait has been exceeded
			if (maxWait && timeSinceLastCall >= maxWait) {
				lastCallTimeRef.current = now;
				setIsPending(true);
				func(...args);
				lastArgsRef.current = null;
				setIsPending(false);
				return;
			}

			// Set new timeout for trailing execution
			if (trailing) {
				setIsPending(true);
				timeoutRef.current = setTimeout(() => {
					lastCallTimeRef.current = Date.now();
					setIsPending(false);
					const pendingArgs = lastArgsRef.current;
					lastArgsRef.current = null;
					if (pendingArgs) {
						func(...pendingArgs);
					}
				}, delay);
			}
		},
		[func, delay, leading, trailing, maxWait]
	);

	return {
		debounced,
		cancel,
		flush,
		isPending,
	};
}
