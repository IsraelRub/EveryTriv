import { useEffect, useRef } from 'react';

/**
 * Hook to track the previous value of a state or prop
 * @param value The current value to track
 * @returns The previous value
 */
export function usePrevious<T>(value: T): T | undefined {
	const ref = useRef<T>();

	useEffect(() => {
		ref.current = value;
	}, [value]);

	return ref.current;
}

/**
 * Hook to track if a value has changed
 * @param value The value to track
 * @returns Object with current, previous, and hasChanged boolean
 */
export function useValueChange<T>(value: T): {
	current: T;
	previous: T | undefined;
	hasChanged: boolean;
} {
	const previous = usePrevious(value);

	return {
		current: value,
		previous,
		hasChanged: previous !== undefined && previous !== value,
	};
}
