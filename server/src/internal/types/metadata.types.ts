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
 * @description Metadata for HTTP requests and API calls
 */
export interface RequestMetadata {
	/** Request ID for tracking */
	requestId?: string;
	/** User ID making the request */
	userId?: string;
	/** IP address */
	ipAddress?: string;
	/** User agent */
	userAgent?: string;
	/** Referrer URL */
	referrer?: string;
	/** Campaign tracking */
	campaign?: string;
	/** Affiliate tracking */
	affiliate?: string;
	/** API version */
	apiVersion?: string;
	/** Request source */
	requestSource?: 'web' | 'mobile' | 'api';
}

/**
 * Analytics metadata interface
 * @interface AnalyticsMetadata
 * @description Metadata for analytics and tracking events
 */
export interface AnalyticsMetadata {
	/** Event type */
	eventType?: string;
	/** Session ID */
	sessionId?: string;
	/** Page or endpoint */
	page?: string;
	/** Action performed */
	action?: string;
	/** Result of action */
	result?: 'success' | 'failure' | 'error';
	/** Duration in milliseconds */
	duration?: number;
	/** Value associated with event */
	value?: number;
	/** Environment */
	environment?: 'development' | 'staging' | 'production' | 'test';
	/** UTM parameters */
	utmSource?: string;
	utmMedium?: string;
	utmCampaign?: string;
}

/**
 * Cache metadata interface
 * @interface CacheMetadata
 * @description Metadata for caching operations
 */
export interface CacheMetadata {
	/** Time to live in seconds */
	ttl?: number;
	/** Cache key */
	key?: string;
	/** Cache tags for invalidation */
	tags?: string[];
	/** Whether cache is disabled */
	disabled?: boolean;
	/** Cache condition function */
	condition?: (request: unknown) => boolean;
	/** Invalidation triggers */
	invalidateOn?: string[];
}

/**
 * Bulk operation metadata interface
 * @interface BulkMetadata
 * @description Metadata for bulk operations
 */
export interface BulkMetadata {
	/** Whether this is a bulk operation */
	isBulk: boolean;
	/** Batch size */
	batchSize: number;
	/** Type of operation */
	operationType: string;
	/** Optimization level */
	optimizationLevel: string;
}
