/**
 * Storage Module Index
 *
 * @module StorageModule
 * @description Storage module with metrics, management, and utilities
 * @author EveryTriv Team
 */

// ============================================================================
// BASE UTILITIES
// ============================================================================

/**
 * Base storage utilities
 * @description Core utilities for storage operations, metrics tracking, and configuration
 */
export { StorageMetricsTracker } from './base/metrics-tracker';
export { StorageConfigFactory } from './base/storage-config';
export { StorageUtils } from './base/storage-utils';

// ============================================================================
// STORAGE SERVICES
// ============================================================================

/**
 * Storage service implementations
 * @description Service classes for storage management, metrics, and base functionality
 */
export { BaseStorageService } from './services/baseStorage.service';
export { MetricsService, metricsService } from './services/metrics.service';
export { StorageManagerService } from './services/storageManager.service';

// ============================================================================
// EXTERNAL IMPORTS
// ============================================================================

/**
 * Utility function imports
 * @description Time formatting and timestamp utilities
 */
export { formatTime } from '../../utils';

/**
 * Error constants imports
 * @description Storage error message constants
 */
export { STORAGE_ERROR_MESSAGES } from '../../constants/core/error.constants';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Core storage types
 * @description Fundamental storage type definitions and interfaces
 */
export type {
	CacheStorage,
	StorageCleanupOptions,
	StorageConfig,
	StorageItemMetadata,
	StorageOperationResult,
	StorageService as StorageService,
	StorageStats,
	UserProgressData,
} from '../../types';

/**
 * Extended storage types
 * @description Additional storage types for metrics and synchronization
 */
export type { StorageMetrics, StorageSyncOptions } from '../../types/infrastructure/storage.types';

/**
 * Cache data types
 * @description Cache-specific type definitions
 */
export type { CacheData } from '../../types/infrastructure/cache.types';

/**
 * Error utility function imports
 * @description Error utility function for formatting error messages
 */
export { getErrorMessage } from '../../utils';
