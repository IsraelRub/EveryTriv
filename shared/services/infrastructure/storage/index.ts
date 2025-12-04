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
