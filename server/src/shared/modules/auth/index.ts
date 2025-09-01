/**
 * Shared Auth Module Index
 *
 * @module SharedAuthModule
 * @description Shared authentication module for cross-feature authentication
 * @used_by server/features/auth, server/features/user, server/middleware
 */

/**
 * Shared authentication module
 * @description Common authentication functionality across features
 * @used_by server/features, server/app.module
 */
export { AuthSharedModule } from './auth.module';

/**
 * Authentication guard
 * @description JWT-based authentication guard
 * @used_by server/features, server/controllers
 */
export { AuthGuard } from './auth.guard';

/**
 * Optional authentication guard
 * @description Optional authentication for public routes
 * @used_by server/features, server/controllers
 */
export { OptionalAuthGuard } from './optional-auth.guard';

/**
 * Google OAuth strategy
 * @description Google OAuth authentication strategy
 * @used_by server/features/user, server/controllers
 */
export { GoogleStrategy } from './google.strategy';
