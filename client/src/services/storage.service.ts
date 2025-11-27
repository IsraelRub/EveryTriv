/**
 * Client Storage Service
 * @module ClientStorageService
 * @description Browser localStorage wrapper with type-safe operations and runtime validation
 * @used_by client/src/services, client/src/utils, client/src/components
 */
import type { StorageOperationResult } from '@shared/types';
import { isStringArray } from '@shared/utils';

/**
 * Type guard function for runtime validation
 * @template T - The expected type
 */
type TypeGuard<T> = (value: unknown) => value is T;

/**
 * Default validators for primitive types
 */
const defaultValidators = {
	string: (value: unknown): value is string => typeof value === 'string',
	number: (value: unknown): value is number => typeof value === 'number' && !isNaN(value),
	boolean: (value: unknown): value is boolean => typeof value === 'boolean',
} as const;

class ClientStorageService {
	/**
	 * Get string value from localStorage with automatic runtime validation
	 * @param key - Storage key
	 * @returns Storage operation result with validated string
	 */
	async getString(key: string): Promise<StorageOperationResult<string>> {
		return this.get(key, defaultValidators.string);
	}

	/**
	 * Get number value from localStorage with automatic runtime validation
	 * @param key - Storage key
	 * @returns Storage operation result with validated number
	 */
	async getNumber(key: string): Promise<StorageOperationResult<number>> {
		return this.get(key, defaultValidators.number);
	}

	/**
	 * Get boolean value from localStorage with automatic runtime validation
	 * @param key - Storage key
	 * @returns Storage operation result with validated boolean
	 */
	async getBoolean(key: string): Promise<StorageOperationResult<boolean>> {
		return this.get(key, defaultValidators.boolean);
	}

	/**
	 * Get string array value from localStorage with automatic runtime validation
	 * @param key - Storage key
	 * @returns Storage operation result with validated string array
	 */
	async getStringArray(key: string): Promise<StorageOperationResult<string[]>> {
		return this.get(key, isStringArray);
	}

	/**
	 * Get complex type value from localStorage with required runtime validation
	 * @param key - Storage key
	 * @param validator - Required type guard for runtime validation
	 * @returns Storage operation result with validated data
	 * @description For primitive types (string, number, boolean), use getString(), getNumber(), or getBoolean() instead.
	 * For complex types, validator is required to ensure type safety.
	 */
	async get<T>(key: string, validator: TypeGuard<T>): Promise<StorageOperationResult<T>> {
		try {
			const item = localStorage.getItem(key);
			if (item === null) {
				return { success: false, data: undefined, timestamp: new Date() };
			}

			const parsed = JSON.parse(item);

			// Perform runtime validation
			if (validator(parsed)) {
				return { success: true, data: parsed, timestamp: new Date() };
			} else {
				// Validation failed - return error
				return { success: false, data: undefined, timestamp: new Date() };
			}
		} catch {
			return { success: false, data: undefined, timestamp: new Date() };
		}
	}

	async set<T>(key: string, value: T): Promise<StorageOperationResult<T>> {
		try {
			localStorage.setItem(key, JSON.stringify(value));
			return { success: true, data: value, timestamp: new Date() };
		} catch {
			return { success: false, data: undefined, timestamp: new Date() };
		}
	}

	async delete(key: string): Promise<StorageOperationResult<boolean>> {
		try {
			localStorage.removeItem(key);
			return { success: true, data: true, timestamp: new Date() };
		} catch {
			return { success: false, data: false, timestamp: new Date() };
		}
	}
}

export const storageService = new ClientStorageService();
