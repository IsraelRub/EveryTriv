/**
 * Performance Decorators
 *
 * @module PerformanceDecorators
 * @description Decorators for performance monitoring and optimization
 * @author EveryTriv Team
 */
import { SetMetadata } from '@nestjs/common';

/**
 * Set performance threshold for endpoint
 * @param threshold Performance threshold in milliseconds
 * @returns Method decorator that sets performance threshold
 * @example
 * ```typescript
 * @Get('fast-data')
 * @PerformanceThreshold(100)
 * async getFastData() {
 *   // Fast endpoint with performance monitoring
 * }
 * ```
 */
export const PerformanceThreshold = (threshold: number) => SetMetadata('performanceThreshold', threshold);

/**
 * Set performance monitoring with custom metrics
 * @param config Performance monitoring configuration
 * @returns Method decorator that sets performance monitoring
 * @example
 * ```typescript
 * @Get('monitored')
 * @PerformanceMonitoring({
 *   threshold: 500,
 *   trackMemory: true,
 *   trackCpu: true,
 *   alertOnSlow: true
 * })
 * async getMonitoredData() {
 *   // Endpoint with comprehensive performance monitoring
 * }
 * ```
 */
export const PerformanceMonitoring = (config: {
	threshold: number;
	trackMemory?: boolean;
	trackCpu?: boolean;
	alertOnSlow?: boolean;
}) => SetMetadata('performanceMonitoring', config);

/**
 * Set database query optimization
 * @param config Query optimization configuration
 * @returns Method decorator that sets query optimization
 * @example
 * ```typescript
 * @Get('optimized-query')
 * @QueryOptimization({
 *   useIndex: true,
 *   limit: 100,
 *   cache: true
 * })
 * async getOptimizedData() {
 *   // Optimized database query
 * }
 * ```
 */
export const QueryOptimization = (config: {
	useIndex?: boolean;
	limit?: number;
	cache?: boolean;
	timeout?: number;
}) => SetMetadata('queryOptimization', config);

/**
 * Set memory usage monitoring
 * @param maxMemory Maximum memory usage in MB
 * @returns Method decorator that sets memory monitoring
 * @example
 * ```typescript
 * @Get('memory-intensive')
 * @MemoryMonitoring(50)
 * async getMemoryIntensiveData() {
 *   // Endpoint with memory monitoring
 * }
 * ```
 */
export const MemoryMonitoring = (maxMemory: number) => SetMetadata('memoryMonitoring', maxMemory);

/**
 * Set CPU usage monitoring
 * @param maxCpu Maximum CPU usage percentage
 * @returns Method decorator that sets CPU monitoring
 * @example
 * ```typescript
 * @Get('cpu-intensive')
 * @CpuMonitoring(80)
 * async getCpuIntensiveData() {
 *   // Endpoint with CPU monitoring
 * }
 * ```
 */
export const CpuMonitoring = (maxCpu: number) => SetMetadata('cpuMonitoring', maxCpu);

/**
 * Set response time tracking
 * @param config Response time tracking configuration
 * @returns Method decorator that sets response time tracking
 * @example
 * ```typescript
 * @Get('tracked')
 * @ResponseTimeTracking({
 *   trackPercentiles: [50, 90, 95, 99],
 *   alertThreshold: 1000
 * })
 * async getTrackedData() {
 *   // Endpoint with response time tracking
 * }
 * ```
 */
export const ResponseTimeTracking = (config: {
	trackPercentiles?: number[];
	alertThreshold?: number;
}) => SetMetadata('responseTimeTracking', config);

/**
 * Set resource usage optimization
 * @param config Resource optimization configuration
 * @returns Method decorator that sets resource optimization
 * @example
 * ```typescript
 * @Get('optimized')
 * @ResourceOptimization({
 *   compress: true,
 *   minify: true,
 *   cache: 3600
 * })
 * async getOptimizedResource() {
 *   // Optimized resource endpoint
 * }
 * ```
 */
export const ResourceOptimization = (config: {
	compress?: boolean;
	minify?: boolean;
	cache?: number;
}) => SetMetadata('resourceOptimization', config);
