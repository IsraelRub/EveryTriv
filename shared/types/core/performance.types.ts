/**
 * Performance types for EveryTriv
 * Shared between client and server
 *
 * @module PerformanceTypes
 * @description Performance monitoring and metrics type definitions
 * @used_by client: animations, server: logging
 */
import { PerformanceOperationStatus } from '../../constants';
import type { BasicValue } from './data.types';

/**
 * Base performance operation interface
 * @interface BasePerformanceOperation
 * @description Common structure for performance operations across client and server
 * @used_by client animations, server logging
 */
export interface BasePerformanceOperation {
	id: string;
	startTime: number;
	duration: number | null;
	status: PerformanceOperationStatus;
	error?: string;
	metadata?: Record<string, BasicValue>;
}

/**
 * Performance operation summary interface
 * @interface PerformanceOperationSummary
 * @description Summary of performance operations with average metrics
 * @used_by server logging, analytics
 */
export interface PerformanceOperationSummary {
	operation: string;
	averageDuration: number;
	totalOperations?: number;
	slowOperations?: number;
	errorCount?: number;
}

/**
 * Performance operation details interface
 * @interface PerformanceOperationDetails
 * @description Detailed performance operation data
 * @used_by server logging, detailed analytics
 */
export interface PerformanceOperationDetails {
	id: string;
	duration: number;
	startTime: number;
	endTime: number;
	operation?: string;
	metadata?: Record<string, BasicValue>;
}

/**
 * Performance metrics interface
 * @interface PerformanceMetrics
 * @description Overall performance metrics
 * @used_by client animations, server monitoring
 */
export interface PerformanceMetrics {
	totalOperations: number;
	averageDuration: number;
	slowOperations: string[];
	errorCount: number;
	lastUpdated?: Date;
}

/**
 * Performance settings interface
 * @interface PerformanceSettings
 * @description Configuration for performance monitoring
 * @used_by client animations, server logging
 */
export interface PerformanceSettings {
	slowThreshold: number;
	maxOperations: number;
	enabled: boolean;
	logSlowOperations: boolean;
	logErrors: boolean;
}

/**
 * Performance context interface
 * @interface PerformanceContext
 * @description Context for performance operations
 * @used_by client animations, server logging
 */
export interface PerformanceContext {
	userId?: string;
	sessionId?: string;
	requestId?: string;
	context?: Record<string, BasicValue>;
}
