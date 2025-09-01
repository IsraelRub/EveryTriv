/**
 * TypeORM specific types for database operations
 *
 * @module TypeORMTypes
 * @description Type definitions for TypeORM operations and queries
 */

/**
 * Type for TypeORM update operations
 * Handles partial updates with proper type safety
 */
export type TypeORMUpdateData<T> = Partial<T>;

/**
 * Type for TypeORM where conditions
 * Ensures proper typing for find operations
 */
export type TypeORMWhereCondition<T> = Partial<T>;

/**
 * Type for TypeORM find options
 * Provides type safety for repository find operations
 */
export interface TypeORMFindOptions<T> {
	where?: TypeORMWhereCondition<T>;
	select?: Array<keyof T>;
	relations?: Array<string>;
	order?: Partial<Record<keyof T, 'ASC' | 'DESC'>>;
	skip?: number;
	take?: number;
}

/**
 * Type for TypeORM save operations
 * Handles both create and update operations
 */
export interface TypeORMSaveData extends Record<string, unknown> {
	id?: string | number;
}
