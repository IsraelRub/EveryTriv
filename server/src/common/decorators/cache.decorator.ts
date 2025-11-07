/**
 * Cache Decorators
 *
 * @module CacheDecorators
 * @description Decorators for caching functionality
 * @author EveryTriv Team
 */
import { SetMetadata } from '@nestjs/common';

/**
 * Set cache configuration for endpoint
 * @param ttl Time to live in seconds
 * @param key Cache key (optional)
 * @returns Method decorator that sets cache configuration
 */
export const Cache = (ttl: number, key?: string) => SetMetadata('cache', { ttl, key });

/**
 * Disable caching for endpoint
 * @returns Method decorator that disables caching
 */
export const NoCache = () => SetMetadata('cache', { ttl: 0, disabled: true });
