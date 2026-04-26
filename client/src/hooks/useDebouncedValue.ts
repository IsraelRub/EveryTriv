import { useEffect, useRef, useState } from 'react';

export function useDebouncedValue<T>(value: T, delayMs: number, shouldSkipDebounce?: (next: T) => boolean): T {
	const [debounced, setDebounced] = useState<T>(value);
	const shouldSkipRef = useRef(shouldSkipDebounce);
	shouldSkipRef.current = shouldSkipDebounce;

	useEffect(() => {
		if (shouldSkipRef.current?.(value)) {
			setDebounced(value);
			return;
		}
		const id = window.setTimeout(() => {
			setDebounced(value);
		}, delayMs);
		return () => window.clearTimeout(id);
	}, [value, delayMs]);

	return debounced;
}
