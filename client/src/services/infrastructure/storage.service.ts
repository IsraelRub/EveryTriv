import { VALIDATORS } from '@shared/constants';
import type { StorageOperationResult, TypeGuard } from '@shared/types';
import { isStringArray } from '@shared/utils';

import { STORAGE_KEYS } from '@/constants';

class StorageService {
	async getString(key: string): Promise<StorageOperationResult<string>> {
		return this.get(key, VALIDATORS.string);
	}

	async getNumber(key: string): Promise<StorageOperationResult<number>> {
		return this.get(key, VALIDATORS.number);
	}

	async getBoolean(key: string): Promise<StorageOperationResult<boolean>> {
		return this.get(key, VALIDATORS.boolean);
	}

	async getStringArray(key: string): Promise<StorageOperationResult<string[]>> {
		return this.get(key, isStringArray);
	}

	async getDate(key: string): Promise<StorageOperationResult<Date>> {
		const result = await this.get(key, VALIDATORS.date);
		if (result.success && result.data) {
			// If date was stored as string, convert it to Date object
			if (typeof result.data === 'string') {
				return { success: true, data: new Date(result.data), timestamp: new Date() };
			}
			// result.data is already a Date (validated by VALIDATORS.date)
			return { success: true, data: result.data, timestamp: new Date() };
		}
		return { success: false, data: undefined, timestamp: new Date() };
	}

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

			// Dispatch custom event for auth token changes (same window)
			if (key === STORAGE_KEYS.AUTH_TOKEN && typeof window !== 'undefined') {
				window.dispatchEvent(new Event('auth-token-changed'));
			}

			return { success: true, data: value, timestamp: new Date() };
		} catch {
			return { success: false, data: undefined, timestamp: new Date() };
		}
	}

	async delete(key: string): Promise<StorageOperationResult<boolean>> {
		try {
			localStorage.removeItem(key);

			// Dispatch custom event for auth token changes (same window)
			if (key === STORAGE_KEYS.AUTH_TOKEN && typeof window !== 'undefined') {
				window.dispatchEvent(new Event('auth-token-changed'));
			}

			return { success: true, data: true, timestamp: new Date() };
		} catch {
			return { success: false, data: false, timestamp: new Date() };
		}
	}
}

export const storageService = new StorageService();
