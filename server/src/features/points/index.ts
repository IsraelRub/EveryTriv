/**
 * Points Feature Module
 *
 * @module PointsFeature
 * @description Points purchase and management functionality
 * @used_by server/app, server/features, server/controllers
 */

/**
 * Points controller
 * @description Handles points-related HTTP requests
 * @used_by server/app, server/routes
 */
export { PointsController } from './points.controller';

/**
 * Points service
 * @description Business logic for points management
 * @used_by server/features/points, server/controllers
 */
export { PointsService } from './points.service';

/**
 * Points module
 * @description NestJS module for points feature
 * @used_by server/app, server/features
 */
export { PointsModule } from './points.module';
