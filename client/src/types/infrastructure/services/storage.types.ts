/**
 * Storage Service Types
 * @module StorageServiceTypes
 * @description Type definitions for storage service
 */

/**
 * Type guard function for runtime validation
 * @template T - The expected type
 * @type TypeGuard
 * @description Function that validates if a value is of type T
 */
export type TypeGuard<T> = (value: unknown) => value is T;
