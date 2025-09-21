/**
 * Payment Feature Module
 *
 * @module PaymentFeature
 * @description Payment processing feature module
 * @used_by server/src/app, server/src/features, server/src/controllers
 */

/**
 * Payment DTOs
 * @description Data transfer objects for payment operations
 * @used_by server/src/features/payment, server/src/controllers
 */
export * from './dtos';

/**
 * Payment controller
 * @description Handles payment-related HTTP requests
 * @used_by server/src/app, server/routes
 */
export { PaymentController } from './payment.controller';

/**
 * Payment module
 * @description NestJS module for payment feature
 * @used_by server/src/app, server/src/features
 */
export { PaymentModule } from './payment.module';

/**
 * Payment services
 * @description Business logic for payment processing
 * @used_by server/src/features/payment, server/src/controllers
 */
export * from './payment.service';
