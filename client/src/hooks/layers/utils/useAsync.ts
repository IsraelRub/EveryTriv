import { useCallback, useEffect, useRef, useState } from 'react';

import { AsyncOptions, AsyncState } from '../../../types';

// Simple in-memory cache
// const cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();

export function useAsync<T>(
	asyncFunction: (...args: never[]) => Promise<T>,
	options: AsyncOptions<T> = {}
): [AsyncState<T>, (...args: never[]) => Promise<T>] {
	const {
		// cacheTime = 5 * 60 * 1000, // 5 minutes
		retryCount = 0,
		retryDelay = 1000,
		onSuccess,
		onError,
	} = options;

	const [state, setState] = useState<AsyncState<T>>({
		data: null,
		loading: false,
		error: null,
		isSuccess: false,
	});

	const retryCountRef = useRef(0);
	const abortControllerRef = useRef<AbortController | null>(null);
	const asyncFunctionRef = useRef(asyncFunction);

	// Update ref when function changes
	useEffect(() => {
		asyncFunctionRef.current = asyncFunction;
	}, [asyncFunction]);

	// Cleanup effect to abort any pending requests when component unmounts
	useEffect(() => {
		return () => {
			if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
				abortControllerRef.current.abort();
				abortControllerRef.current = null;
			}
		};
	}, []);

	// Execute async function
	const execute = useCallback(
		async (...args: never[]): Promise<T> => {
			// Cancel previous request if it exists
			if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
				abortControllerRef.current.abort();
			}

			// Create new abort controller
			abortControllerRef.current = new AbortController();

			// Set loading state
			setState(prev => ({
				...prev,
				loading: true,
				error: null,
				isSuccess: false,
			}));

			try {
				// Execute the async function
				const result = await asyncFunctionRef.current(...args);

				// Check if request was aborted
				if (abortControllerRef.current?.signal.aborted) {
					throw new Error('Request was aborted');
				}

				// Set success state
				setState({
					data: result,
					loading: false,
					error: null,
					isSuccess: true,
				});

				onSuccess?.(result);
				return result;
			} catch (error) {
				// Check if request was aborted
				if (abortControllerRef.current?.signal.aborted) {
					throw error;
				}

				// Handle retries
				if (retryCount > 0 && retryCountRef.current < retryCount) {
					retryCountRef.current++;

					// Wait before retrying
					await new Promise(resolve => setTimeout(resolve, retryDelay));

					// Retry the request
					return execute(...args);
				}

				// Set error state
				setState({
					data: null,
					loading: false,
					error: error as Error,
					isSuccess: false,
				});

				onError?.(error as Error);
				throw error;
			} finally {
				// Reset retry count on success or final failure
				retryCountRef.current = 0;
			}
		},
		[retryCount, retryDelay, onSuccess, onError]
	);

	return [state, execute];
}
