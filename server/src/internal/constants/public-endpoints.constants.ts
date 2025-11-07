/**
 * Public Endpoints Constants
 *
 * @module PublicEndpointsConstants
 * @description Centralized list of public endpoints that don't require authentication
 * @used_by server/src/common/guards, server/src/internal/middleware
 */

/**
 * List of public endpoints that skip authentication
 * @description These endpoints are accessible without authentication
 */
export const PUBLIC_ENDPOINTS = ['/leaderboard/global', '/leaderboard/period', '/health', '/status'] as const;
