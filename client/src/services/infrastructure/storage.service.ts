/**
 * Client Storage Service
 * @module ClientStorageService
 * @description Browser localStorage wrapper with type-safe operations and runtime validation
 * @used_by client/src/services, client/src/utils, client/src/components
 */
import { defaultValidators } from '@shared/constants';
import type { StorageOperationResult, TypeGuard } from '@shared/types';
import { isStringArray } from '@shared/utils';

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
	 * Get date value from localStorage with automatic runtime validation
	 * @param key - Storage key
	 * @returns Storage operation result with validated Date (converts ISO strings to Date objects)
	 */
	async getDate(key: string): Promise<StorageOperationResult<Date>> {
		const result = await this.get(key, defaultValidators.date);
		if (result.success && result.data) {
			// If date was stored as string, convert it to Date object
			if (typeof result.data === 'string') {
				return { success: true, data: new Date(result.data), timestamp: new Date() };
			}
			// result.data is already a Date (validated by defaultValidators.date)
			return { success: true, data: result.data, timestamp: new Date() };
		}
		return { success: false, data: undefined, timestamp: new Date() };
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
