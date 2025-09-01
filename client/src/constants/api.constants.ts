/**
 * Client-specific API constants for EveryTriv
 * Extends shared API constants with client-specific functionality
 *
 * @module ClientApiConstants
 * @description Client API configuration and endpoint constants
 * @used_by server: server/src/features/game/game.controller.ts (route definitions), client: client/src/services/api.service.ts (ApiService), client/src/services/http-client.ts (ClientHttpClient)
 */
// Import shared constants
import { DEFAULT_URLS } from 'everytriv-shared/constants';
import { API_ENDPOINTS, API_ENDPOINTS_BASE, API_VERSION, COOKIE_NAMES } from 'everytriv-shared/constants/api.constants';
import { HTTP_CLIENT_CONFIG, HTTP_STATUS_CODES } from 'everytriv-shared/constants/http.constants';

// Client-specific API configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || DEFAULT_URLS.DEV_SERVER;

// Re-export complete API endpoints from shared
export { API_ENDPOINTS };

// Re-export shared constants
export { API_ENDPOINTS_BASE, API_VERSION, COOKIE_NAMES, HTTP_CLIENT_CONFIG, HTTP_STATUS_CODES };
