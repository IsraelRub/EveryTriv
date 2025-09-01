/**
 * HTTP Service Index
 *
 * @module HttpService
 * @description Central export point for HTTP functionality
 * @used_by server/features, server/services
 */

/**
 * HTTP service
 * @description HTTP client service for external API calls
 * @used_by server/features, server/services
 */
export { ServerHttpClient, serverHttpClient } from './http.service';
