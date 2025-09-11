/**
 * User Components Module
 *
 * @module UserComponents
 * @description React components for user profile management, authentication, and preferences
 * @author EveryTriv Team
 * @used_by client/views/user, client/components
 */

/**
 * Complete profile component
 * @description User profile completion form and data collection
 * @used_by client/views/user, client/components
 */
export { default as CompleteProfile } from './CompleteProfile';

/**
 * Favorite topics component
 * @description User topic preferences management and selection
 * @used_by client/views/user, client/components
 */
export { default as FavoriteTopics } from './FavoriteTopics';

/**
 * OAuth callback component
 * @description OAuth authentication callback handling and processing
 * @used_by client/views/auth, client/components
 */
export { default as OAuthCallback } from './OAuthCallback';
