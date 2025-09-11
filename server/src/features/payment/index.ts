/**
 * Payment Feature Module
 *
 * @module PaymentFeature
 * @description Payment processing feature module
 * @used_by server/app, server/features, server/controllers
 */

/**
 * Payment DTOs
 * @description Data transfer objects for payment operations
 * @used_by server/features/payment, server/controllers
 */
export * from './dtos';

/**
 * Payment controller
 * @description Handles payment-related HTTP requests
 * @used_by server/app, server/routes
 */
export { PaymentController } from './payment.controller';

/**
 * Payment module
 * @description NestJS module for payment feature
 * @used_by server/app, server/features
 */
export { PaymentModule } from './payment.module';

/**
 * Payment services
 * @description Business logic for payment processing
 * @used_by server/features/payment, server/controllers
 */
export * from './payment.service';
