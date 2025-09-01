/**
 * User Feature Module
 *
 * @module UserFeature
 * @description User management and profile feature module
 * @used_by server/app, server/features, server/controllers
 */

/**
 * User DTOs
 * @description Data transfer objects for user operations
 * @used_by server/features/user, server/controllers
 */
// export * from './dtos'; // No DTOs currently needed

/**
 * User controller
 * @description Handles user-related HTTP requests
 * @used_by server/app, server/routes
 */
export { UserController } from './user.controller';

/**
 * User module
 * @description NestJS module for user feature
 * @used_by server/app, server/features
 */
export { UserModule } from './user.module';

/**
 * User service
 * @description Business logic for user management
 * @used_by server/features/user, server/controllers
 */
export { UserService } from './user.service';
