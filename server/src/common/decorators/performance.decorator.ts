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
 */
export const PerformanceThreshold = (threshold: number) => SetMetadata('performanceThreshold', threshold);

/**
 * Set performance monitoring with custom metrics
 * @param config Performance monitoring configuration
 * @returns Method decorator that sets performance monitoring
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
 */
export const QueryOptimization = (config: { useIndex?: boolean; limit?: number; cache?: boolean; timeout?: number }) =>
	SetMetadata('queryOptimization', config);

/**
 * Set memory usage monitoring
 * @param maxMemory Maximum memory usage in MB
 * @returns Method decorator that sets memory monitoring
 */
export const MemoryMonitoring = (maxMemory: number) => SetMetadata('memoryMonitoring', maxMemory);

/**
 * Set CPU usage monitoring
 * @param maxCpu Maximum CPU usage percentage
 * @returns Method decorator that sets CPU monitoring
 */
export const CpuMonitoring = (maxCpu: number) => SetMetadata('cpuMonitoring', maxCpu);

/**
 * Set response time tracking
 * @param config Response time tracking configuration
 * @returns Method decorator that sets response time tracking
 */
export const ResponseTimeTracking = (config: { trackPercentiles?: number[]; alertThreshold?: number }) =>
	SetMetadata('responseTimeTracking', config);

/**
 * Set resource usage optimization
 * @param config Resource optimization configuration
 * @returns Method decorator that sets resource optimization
 */
export const ResourceOptimization = (config: { compress?: boolean; minify?: boolean; cache?: number }) =>
	SetMetadata('resourceOptimization', config);
