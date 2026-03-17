import type { StorageOperationResult, TypeGuard } from '@shared/types';
import { VALIDATORS } from '@shared/validation';

import { AUTH_STORAGE_KEYS, AUTH_TOKEN_CHANGED_EVENT, STORAGE_KEYS, type StorageKey } from '@/constants';

function getStorage(key: StorageKey): Storage {
	return AUTH_STORAGE_KEYS.has(key) ? sessionStorage : localStorage;
}

class StorageService {
	async getString(key: StorageKey): Promise<StorageOperationResult<string>> {
		return this.get(key, VALIDATORS.string);
	}

	private async get<T>(key: StorageKey, validator: TypeGuard<T>): Promise<StorageOperationResult<T>> {
		try {
			const item = getStorage(key).getItem(key);
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

	async set<T>(key: StorageKey, value: T): Promise<StorageOperationResult<T>> {
		try {
			getStorage(key).setItem(key, JSON.stringify(value));

			// Dispatch custom event for auth token changes (same window)
			if (key === STORAGE_KEYS.AUTH_TOKEN && typeof window !== 'undefined') {
				window.dispatchEvent(new Event(AUTH_TOKEN_CHANGED_EVENT));
			}

			return { success: true, data: value, timestamp: new Date() };
		} catch {
			return { success: false, data: undefined, timestamp: new Date() };
		}
	}

	async delete(key: StorageKey): Promise<StorageOperationResult<boolean>> {
		try {
			getStorage(key).removeItem(key);

			// Dispatch custom event for auth token changes (same window)
			if (key === STORAGE_KEYS.AUTH_TOKEN && typeof window !== 'undefined') {
				window.dispatchEvent(new Event(AUTH_TOKEN_CHANGED_EVENT));
			}

			return { success: true, data: true, timestamp: new Date() };
		} catch {
			return { success: false, data: false, timestamp: new Date() };
		}
	}
}

export const storageService = new StorageService();
