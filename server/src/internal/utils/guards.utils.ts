/**
 * Guards Utilities
 *
 * @module GuardsUtils
 * @description Utility functions for guards and authentication
 * @used_by server/src/common/guards
 */
import { PUBLIC_ENDPOINTS } from '../constants/public-endpoints.constants';

/**
 * Check if an endpoint is public
 * @param path - The request path to check
 * @returns True if the endpoint is public
 */
export function isPublicEndpoint(path: string): boolean {
	return PUBLIC_ENDPOINTS.some(
		endpoint => path === endpoint || path?.startsWith(endpoint + '?') || path?.startsWith(endpoint + '/')
	);
}
