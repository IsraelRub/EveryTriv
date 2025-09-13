import { useCallback, useEffect, useRef } from 'react';

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
 * Hook to track multiple previous values with enhanced functionality
 * @param value The current value to track
 * @param count Number of previous values to keep
 * @returns Object with values array and utility functions
 */
export function usePreviousValues<T>(
  value: T,
  count: number = 5
): {
  values: T[];
  getPrevious: (index: number) => T | undefined;
  getAverage: () => number;
  hasChanged: boolean;
} {
  const ref = useRef<T[]>([]);
  const previousLength = ref.current.length;

  useEffect(() => {
    ref.current = [value, ...ref.current.slice(0, count - 1)];
  }, [value, count]);

  const getPrevious = useCallback((index: number) => {
    return ref.current[index] || undefined;
  }, []);

  const getAverage = useCallback(() => {
    if (ref.current.length === 0) return 0;
    const numericValues = ref.current.filter(v => typeof v === 'number') as number[];
    if (numericValues.length === 0) return 0;
    return numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
  }, []);

  return {
    values: ref.current,
    getPrevious,
    getAverage,
    hasChanged: ref.current.length !== previousLength,
  };
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
