/**
 * Client-side persistent storage service
 * Extends the shared BaseStorageService for client-specific persistent storage operations
 *
 * Usage:
 * - User preferences that should persist across sessions
 * - Authentication tokens and user data
 * - Game settings and configurations
 * - Historical data that should survive browser restarts
 */
import { BaseStorageService } from '@shared/services/storage';
import {
  StorageCleanupOptions,
  StorageConfig,
  StorageOperationResult,
  StorageService,
  StorageStats,
} from '@shared/types/infrastructure/storage.types';

export class ClientStorageService extends BaseStorageService implements StorageService {
  constructor() {
    const config: StorageConfig = {
      prefix: 'everytriv-client',
      defaultTtl: 3600, // 1 hour
      enableCompression: false,
      maxSize: 10 * 1024 * 1024, // 10MB
      type: 'persistent',
      enableMetrics: true,
      enableSync: true,
    };
    super(config);
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<StorageOperationResult<void>> {
    const startTime = Date.now();
    try {
      const prefixedKey = this.getPrefixedKey(key);
      const serialized = this.serialize(value);

      // Store with metadata for TTL handling
      const itemData = {
        value: serialized,
        timestamp: Date.now(),
        ttl: ttl || this.config.defaultTtl,
      };

      localStorage.setItem(prefixedKey, JSON.stringify(itemData));
      this.updateMetadata(key, serialized.length, ttl);

      this.trackOperationWithTiming('set', startTime, true, 'persistent', serialized.length);
      return this.createSuccessResult<void>();
    } catch (error) {
      this.trackOperationWithTiming('set', startTime, false, 'persistent');
      return this.createErrorResult<void>(`Failed to set item: ${this.formatError(error)}`);
    }
  }

  async get<T>(key: string): Promise<StorageOperationResult<T | null>> {
    const startTime = Date.now();
    try {
      const prefixedKey = this.getPrefixedKey(key);
      const item = localStorage.getItem(prefixedKey);

      if (!item) {
        this.trackOperationWithTiming('get', startTime, true, 'persistent');
        return this.createSuccessResult<T | null>(null);
      }

      const itemData = JSON.parse(item);
      const now = Date.now();

      // Check if item has expired
      if (itemData.ttl && now - itemData.timestamp > itemData.ttl * 1000) {
        localStorage.removeItem(prefixedKey);
        this.trackOperationWithTiming('get', startTime, true, 'persistent');
        return this.createSuccessResult<T | null>(null);
      }

      const deserialized = this.deserialize<T>(itemData.value);
      this.updateMetadata(key, itemData.value.length);

      this.trackOperationWithTiming('get', startTime, true, 'persistent', itemData.value.length);
      return this.createSuccessResult<T | null>(deserialized);
    } catch (error) {
      this.trackOperationWithTiming('get', startTime, false, 'persistent');
      return this.createErrorResult<T | null>(`Failed to get item: ${this.formatError(error)}`);
    }
  }

  async delete(key: string): Promise<StorageOperationResult<void>> {
    const startTime = Date.now();
    try {
      const prefixedKey = this.getPrefixedKey(key);
      localStorage.removeItem(prefixedKey);
      this.metadata.delete(key);

      this.trackOperationWithTiming('delete', startTime, true, 'persistent');
      return this.createSuccessResult<void>();
    } catch (error) {
      this.trackOperationWithTiming('delete', startTime, false, 'persistent');
      return this.createErrorResult<void>(`Failed to delete item: ${this.formatError(error)}`);
    }
  }

  async exists(key: string): Promise<StorageOperationResult<boolean>> {
    const startTime = Date.now();
    try {
      const prefixedKey = this.getPrefixedKey(key);
      const exists = localStorage.getItem(prefixedKey);

      this.trackOperationWithTiming('exists', startTime, true, 'persistent');
      return this.createSuccessResult<boolean>(exists !== null);
    } catch (error) {
      this.trackOperationWithTiming('exists', startTime, false, 'persistent');
      return this.createErrorResult<boolean>(
        `Failed to check existence: ${this.formatError(error)}`
      );
    }
  }

  async clear(): Promise<StorageOperationResult<void>> {
    const startTime = Date.now();
    try {
      const keysResult = await this.getKeys();
      if (!keysResult.success || !keysResult.data) {
        this.trackOperationWithTiming('clear', startTime, false, 'persistent');
        return this.createErrorResult<void>('Failed to get keys for clearing');
      }

      keysResult.data.forEach((key: string) => {
        const prefixedKey = this.getPrefixedKey(key);
        localStorage.removeItem(prefixedKey);
      });

      this.metadata.clear();
      this.trackOperationWithTiming('clear', startTime, true, 'persistent');
      return this.createSuccessResult<void>();
    } catch (error) {
      this.trackOperationWithTiming('clear', startTime, false, 'persistent');
      return this.createErrorResult<void>(`Failed to clear storage: ${this.formatError(error)}`);
    }
  }

  async getKeys(): Promise<StorageOperationResult<string[]>> {
    const startTime = Date.now();
    try {
      const unprefixedKeys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.config.prefix)) {
          unprefixedKeys.push(key.replace(this.config.prefix, ''));
        }
      }

      this.trackOperationWithTiming('getKeys', startTime, true, 'persistent');
      return this.createSuccessResult<string[]>(unprefixedKeys);
    } catch (error) {
      this.trackOperationWithTiming('getKeys', startTime, false, 'persistent');
      return this.createErrorResult<string[]>(`Failed to get keys: ${this.formatError(error)}`);
    }
  }

  async getStats(): Promise<StorageOperationResult<StorageStats>> {
    return super.getStats();
  }

  async cleanup(options?: StorageCleanupOptions): Promise<StorageOperationResult<void>> {
    return super.cleanup(options);
  }

  async invalidate(pattern: string): Promise<StorageOperationResult<void>> {
    return super.invalidate(pattern);
  }

  async getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    return super.getOrSet(key, factory, ttl);
  }

  // Session storage methods
  async setSession<T>(key: string, value: T): Promise<void> {
    const prefixedKey = this.getPrefixedKey(key);
    const serializedValue = JSON.stringify(value);
    sessionStorage.setItem(prefixedKey, serializedValue);
  }

  async getSession<T>(key: string): Promise<T | null> {
    const prefixedKey = this.getPrefixedKey(key);
    const item = sessionStorage.getItem(prefixedKey);
    if (!item) return null;
    try {
      return JSON.parse(item);
    } catch {
      return null;
    }
  }

  async removeSession(key: string): Promise<void> {
    const prefixedKey = this.getPrefixedKey(key);
    sessionStorage.removeItem(prefixedKey);
  }

  async clearSession(): Promise<void> {
    const keys = Object.keys(sessionStorage);
    const prefixedKeys = keys.filter(key => key.startsWith(this.getPrefixedKey('')));
    prefixedKeys.forEach(key => sessionStorage.removeItem(key));
  }

  // Custom difficulty methods
  async getRecentCustomDifficulties(): Promise<string[]> {
    const result = await this.get<string[]>('recentCustomDifficulties');
    return result.success && result.data ? result.data : [];
  }

  async saveCustomDifficulty(topic: string, difficulty: string): Promise<void> {
    const difficulties = await this.getRecentCustomDifficulties();
    const newDifficulty = `${topic}:${difficulty}`;

    // Remove if already exists and add to front
    const filtered = difficulties.filter(d => d !== newDifficulty);
    const updated = [newDifficulty, ...filtered].slice(0, 10); // Keep last 10

    await this.set('recentCustomDifficulties', updated);
  }

  async clearCustomDifficulties(): Promise<void> {
    await this.delete('recentCustomDifficulties');
  }
}

export const storageService = new ClientStorageService();
