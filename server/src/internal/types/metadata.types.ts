/**
 * Core metadata types for EveryTriv
 *
 * @module CoreMetadataTypes
 * @description Base metadata interfaces used across the entire application
 * @author EveryTriv Team
 */

// BaseMetadata is defined in shared/types/core/metadata.types.ts

// ExtendedMetadata was removed - not used anywhere in the codebase

/**
 * Request metadata interface
 * @interface RequestMetadata
 * @description Comprehensive metadata for HTTP requests and API calls tracking
 */
export interface RequestMetadata {
	requestId?: string;
	userId?: string;
	ipAddress?: string;
	userAgent?: string;
	referrer?: string;
	campaign?: string;
	affiliate?: string;
	apiVersion?: string;
	requestSource?: 'web' | 'mobile' | 'api';
}

/**
 * Analytics metadata interface
 * @interface AnalyticsMetadata
 * @description Comprehensive metadata for analytics and tracking events
 */
export interface AnalyticsMetadata {
	eventType?: string;
	sessionId?: string;
	page?: string;
	action?: string;
	result?: 'success' | 'failure' | 'error';
	duration?: number;
	value?: number;
	environment?: 'development' | 'staging' | 'production' | 'test';
	utmSource?: string;
	utmMedium?: string;
	utmCampaign?: string;
}

/**
 * Cache metadata interface
 * @interface CacheMetadata
 * @description Comprehensive metadata for caching operations and configuration
 */
export interface CacheMetadata {
	ttl?: number;
	key?: string;
	tags?: string[];
	disabled?: boolean;
	condition?: (request: unknown) => boolean;
	invalidateOn?: string[];
}

/**
 * Bulk operation metadata interface
 * @interface BulkMetadata
 * @description Metadata for bulk operations and batch processing
 */
export interface BulkMetadata {
	isBulk: boolean;
	batchSize: number;
	operationType: string;
	optimization: 'none' | 'basic' | 'aggressive';
}
