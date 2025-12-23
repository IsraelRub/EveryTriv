/**
 * Server API Types
 * @module ServerApiTypes
 * @description Server-side API type definitions
 */

import type { MiddlewareMetrics } from '@internal/types';

/**
 * Middleware Metrics Summary
 * @interface MiddlewareMetricsSummary
 * @description Summary of middleware performance metrics
 */
export interface MiddlewareMetricsSummary {
	totalMiddlewares: number;
	totalRequests: number;
	averagePerformance: number;
	slowestMiddleware: string;
	mostUsedMiddleware: string;
}

/**
 * All Middleware Metrics Response
 * @interface AllMiddlewareMetricsResponse
 * @description Complete middleware metrics response
 */
export interface AllMiddlewareMetricsResponse {
	summary: MiddlewareMetricsSummary;
	metrics: Record<string, MiddlewareMetrics> | MiddlewareMetrics;
	storageMetrics: unknown;
}

/**
 * Middleware Metrics Response
 * @type MiddlewareMetricsResponse
 * @description Middleware metrics response type
 */
export type MiddlewareMetricsResponse = MiddlewareMetrics | Record<string, MiddlewareMetrics>;
