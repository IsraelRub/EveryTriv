import { useCallback, useEffect, useRef, useState } from 'react';

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
export function useDebouncedCallback<T extends (...args: never[]) => unknown>(
	func: T,
	delay: number,
	options: {
		leading?: boolean;
		trailing?: boolean;
		maxWait?: number;
	} = {}
): {
	debounced: T;
	cancel: () => void;
	flush: () => void;
	isPending: boolean;
} {
	const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
	const lastCallTimeRef = useRef<number>(0);
	const [isPending, setIsPending] = useState(false);

	const { leading = false, trailing = true, maxWait } = options;

	const cancel = useCallback(() => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = undefined;
		}
		setIsPending(false);
	}, []);

	const flush = useCallback(() => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = undefined;
		}
		setIsPending(false);
		func();
	}, [func]);

	const debounced = useCallback(
		((...args: never[]) => {
			const now = Date.now();
			const timeSinceLastCall = now - lastCallTimeRef.current;

			// Leading edge execution
			if (leading && !timeoutRef.current) {
				lastCallTimeRef.current = now;
				setIsPending(true);
				func(...args);
				return;
			}

			// Cancel existing timeout
			cancel();

			// Check if maxWait has been exceeded
			if (maxWait && timeSinceLastCall >= maxWait) {
				lastCallTimeRef.current = now;
				setIsPending(true);
				func(...args);
				return;
			}

			// Set new timeout for trailing execution
			if (trailing) {
				setIsPending(true);
				timeoutRef.current = setTimeout(() => {
					lastCallTimeRef.current = Date.now();
					setIsPending(false);
					func(...args);
				}, delay);
			}
		}) as T,
		[func, delay, leading, trailing, maxWait, cancel]
	);

	return {
		debounced,
		cancel,
		flush,
		isPending,
	};
}
