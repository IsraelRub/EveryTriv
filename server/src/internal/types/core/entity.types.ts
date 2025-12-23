/**
 * Server Core Entity Types
 * @module ServerCoreEntityTypes
 * @description Base entity type definitions for server-side entities
 */
import type { BaseTimestamps } from '@shared/types';

/**
 * Base entity interface with common fields
 * @interface BaseEntity
 * @description Base interface for all database entities with ID and timestamps
 * @used_by server/src/internal/entities (all TypeORM entities)
 */
export interface BaseEntity extends BaseTimestamps {
	id: string;
}
