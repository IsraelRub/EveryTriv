import { useCallback, useEffect, useState } from 'react';

/**
 * Hook for managing localStorage with type safety
 * @param key The localStorage key
 * @param initialValue The initial value if key doesn't exist
 * @returns [value, setValue, removeValue] tuple
 */
export function useLocalStorage<T>(
	key: string,
	initialValue: T
): [T, (value: T | ((val: T) => T)) => void, () => void] {
	// Get from local storage then parse stored json or return initialValue
	const [storedValue, setStoredValue] = useState<T>(() => {
		try {
			const item = window.localStorage.getItem(key);
			return item ? JSON.parse(item) : initialValue;
		} catch (error) {
			import('../../../services/utils').then(({ logger }) => {
				logger.storageError('Error reading localStorage key', {
					key,
					error: error instanceof Error ? error.message : String(error),
				});
			});
			return initialValue;
		}
	});

	// Return a wrapped version of useState's setter function that persists the new value to localStorage
	const setValue = useCallback(
		(value: T | ((val: T) => T)) => {
			try {
				// Allow value to be a function so we have the same API as useState
				const valueToStore = value instanceof Function ? value(storedValue) : value;
				setStoredValue(valueToStore);
				window.localStorage.setItem(key, JSON.stringify(valueToStore));
			} catch (error) {
				import('../../../services/utils').then(({ logger }) => {
					logger.storageError('Error setting localStorage key', {
						key,
						error: error instanceof Error ? error.message : String(error),
					});
				});
			}
		},
		[key, storedValue]
	);

	// Remove value from localStorage
	const removeValue = useCallback(() => {
		try {
			setStoredValue(initialValue);
			window.localStorage.removeItem(key);
		} catch (error) {
			import('../../../services/utils').then(({ logger }) => {
				logger.storageError('Error removing localStorage key', {
					key,
					error: error instanceof Error ? error.message : String(error),
				});
			});
		}
	}, [key, initialValue]);

	// Listen for changes to this localStorage key in other tabs/windows
	useEffect(() => {
		const handleStorageChange = (e: StorageEvent) => {
			if (e.key === key && e.newValue !== null) {
				try {
					setStoredValue(JSON.parse(e.newValue));
				} catch (error) {
					import('../../../services/utils').then(({ logger }) => {
						logger.storageError('Error parsing localStorage value', {
							key,
							error: error instanceof Error ? error.message : String(error),
						});
					});
				}
			}
		};

		window.addEventListener('storage', handleStorageChange);
		return () => window.removeEventListener('storage', handleStorageChange);
	}, [key]);

	return [storedValue, setValue, removeValue];
}
