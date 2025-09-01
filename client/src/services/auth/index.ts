/**
 * Authentication Services Index
 *
 * @module AuthServices
 * @description User authentication, session management, and user profile services
 * @used_by client/hooks/useAuth, client/views/auth, client/components
 */

/**
 * Authentication service
 * @description User authentication and session management
 * @used_by client/hooks/useAuth, client/views/auth, client/components
 */
export { authService } from './auth.service';

/**
 * User profile service
 * @description User profile management and updates
 * @used_by client/views/user, client/components/user
 */
export { userService } from './user.service';
