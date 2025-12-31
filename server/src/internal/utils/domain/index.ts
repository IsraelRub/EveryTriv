/**
 * Server Domain Utilities Index
 *
 * @module ServerDomainUtils
 * @description Central export point for all server-side domain utility functions
 * @note Payment utilities, multiplayer guards, and entity guards are now in @shared/utils/domain
 */

/**
 * Re-export entity type guards from shared
 * @description Entity type guards are now in @shared/utils/domain for use by both client and server
 */
export * from '@shared/utils/domain/entityGuards';
