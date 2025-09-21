/**
 * Auth Feature Index
 *
 * @module AuthFeature
 * @description authentication feature module
 * @used_by server/src/app, server/src/controllers
 */

/**
 * Auth controller
 * @description Authentication API endpoints
 * @used_by server/src/app, server/src/controllers
 */
export { AuthController } from './auth.controller';

/**
 * Auth service
 * @description Authentication business logic
 * @used_by server/features/auth, server/controllers
 */
export { AuthService } from './auth.service';

/**
 * Auth module
 * @description authentication module configuration
 * @used_by server/app, server/modules
 */
export { AuthModule } from './auth.module';

/**
 * Google OAuth strategy
 * @description Google OAuth authentication strategy
 * @used_by server/features/auth, server/controllers
 */
export { GoogleStrategy } from './google.strategy';

/**
 * Auth DTOs
 * @description Authentication data transfer objects
 * @used_by server/features/auth, server/controllers
 */
export * from './dtos';
