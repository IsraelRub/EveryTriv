/**
 * User Components Module
 *
 * @module UserComponents
 * @description React components for user profile management, authentication, and preferences
 * @author EveryTriv Team
 * @used_by client/src/views/user, client/src/components
 */

/**
 * Complete profile component
 * @description User profile completion form and data collection
 * @used_by client/src/views/user, client/src/components
 */
export { default as CompleteProfile } from './CompleteProfile';

/**
 * Favorite topics component
 * @description User topic preferences management and selection
 * @used_by client/src/views/user, client/src/components
 */
export { default as FavoriteTopics } from './FavoriteTopics';

/**
 * OAuth callback component
 * @description OAuth authentication callback handling and processing
 * @used_by client/src/views/auth, client/src/components
 */
export { default as OAuthCallback } from './OAuthCallback';
