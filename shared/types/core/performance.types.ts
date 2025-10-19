/**
 * Performance types for EveryTriv
 * Shared between client and server
 *
 * @module PerformanceTypes
 * @description Performance monitoring and metrics type definitions
 * @used_by client: animations, server: logging
 */
import type { BasicValue } from './data.types';

/**
 * Base performance operation interface
 * @interface BasePerformanceOperation
 * @description Common structure for performance operations across client and server
 * @used_by client animations, server logging
 */
export interface BasePerformanceOperation {
	/** Unique identifier for the operation */
	id: string;
	/** Start time in milliseconds */
	startTime: number;
	/** Duration in milliseconds, null if not completed */
	duration: number | null;
	/** Current status of the operation */
	status: 'pending' | 'completed' | 'error';
	/** Error message if status is 'error' */
	error?: string;
	/** Additional metadata */
	metadata?: Record<string, BasicValue>;
}

/**
 * Performance operation summary interface
 * @interface PerformanceOperationSummary
 * @description Summary of performance operations with average metrics
 * @used_by server logging, analytics
 */
export interface PerformanceOperationSummary {
	/** Operation name/type */
	operation: string;
	/** Average duration across all instances */
	averageDuration: number;
	/** Total number of operations */
	totalOperations?: number;
	/** Number of slow operations */
	slowOperations?: number;
	/** Number of failed operations */
	errorCount?: number;
}

/**
 * Performance operation details interface
 * @interface PerformanceOperationDetails
 * @description Detailed performance operation data
 * @used_by server logging, detailed analytics
 */
export interface PerformanceOperationDetails {
	/** Unique identifier */
	id: string;
	/** Duration in milliseconds */
	duration: number;
	/** Start time in milliseconds */
	startTime: number;
	/** End time in milliseconds */
	endTime: number;
	/** Operation name/type */
	operation?: string;
	/** Additional metadata */
	metadata?: Record<string, BasicValue>;
}

/**
 * Performance metrics interface
 * @interface PerformanceMetrics
 * @description Overall performance metrics
 * @used_by client animations, server monitoring
 */
export interface PerformanceMetrics {
	/** Total number of operations */
	totalOperations: number;
	/** Average duration across all operations */
	averageDuration: number;
	/** List of slow operation IDs */
	slowOperations: string[];
	/** Number of failed operations */
	errorCount: number;
	/** Timestamp of last update */
	lastUpdated?: Date;
}

/**
 * Performance settings interface
 * @interface PerformanceSettings
 * @description Configuration for performance monitoring
 * @used_by client animations, server logging
 */
export interface PerformanceSettings {
	/** Threshold for considering operations as slow (ms) */
	slowThreshold: number;
	/** Maximum number of operations to track */
	maxOperations: number;
	/** Whether performance monitoring is enabled */
	enabled: boolean;
	/** Whether to log slow operations */
	logSlowOperations: boolean;
	/** Whether to log errors */
	logErrors: boolean;
}

/**
 * Performance context interface
 * @interface PerformanceContext
 * @description Context for performance operations
 * @used_by client animations, server logging
 */
export interface PerformanceContext {
	/** User ID if applicable */
	userId?: string;
	/** Session ID */
	sessionId?: string;
	/** Request ID for server operations */
	requestId?: string;
	/** Additional context data */
	context?: Record<string, BasicValue>;
}
