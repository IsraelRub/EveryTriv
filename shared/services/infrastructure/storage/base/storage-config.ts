/**
 * Storage Configuration Factory
 *
 * @module StorageConfig
 * @description configuration factory for all storage services
 * @used_by shared/services/storage/services/baseStorage.service.ts, shared/services/storage
 */
import { StorageConfig, StorageType } from '@shared/types';

/**
 * Storage Configuration Factory
 * @class StorageConfigFactory
 * @description Creates consistent configuration for all storage services
 */
export class StorageConfigFactory {
	/**
	 * Create default configuration for storage service
	 * @param type Storage type
	 * @param overrides Configuration overrides
	 * @returns Storage configuration
	 */
	static createDefaultConfig(type: StorageType = 'persistent', overrides: Partial<StorageConfig> = {}): StorageConfig {
		return {
			prefix: 'everytriv_',
			defaultTtl: 3600, // 1 hour default
			enableCompression: false,
			maxSize: 5 * 1024 * 1024, // 5MB default
			type,
			enableMetrics: true,
			enableSync: true,
			...overrides,
		};
	}

	/**
	 * Create persistent storage configuration
	 * @param overrides Configuration overrides
	 * @returns Persistent storage configuration
	 */
	static createPersistentConfig(overrides: Partial<StorageConfig> = {}): StorageConfig {
		return this.createDefaultConfig('persistent', overrides);
	}

	/**
	 * Create cache storage configuration
	 * @param overrides Configuration overrides
	 * @returns Cache storage configuration
	 */
	static createCacheConfig(overrides: Partial<StorageConfig> = {}): StorageConfig {
		return this.createDefaultConfig('cache', overrides);
	}

	/**
	 * Create hybrid storage configuration
	 * @param overrides Configuration overrides
	 * @returns Hybrid storage configuration
	 */
	static createHybridConfig(overrides: Partial<StorageConfig> = {}): StorageConfig {
		return this.createDefaultConfig('hybrid', overrides);
	}
}
