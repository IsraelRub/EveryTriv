/**
 * AI Providers Management Module
 *
 * @module ProvidersManagement
 * @description Centralized management for AI trivia question providers
 * @used_by server/features/game/logic/trivia-generation.service.ts
 */

// Provider management service
export { AiProvidersService } from './providers.service';

// Provider controller
export { AiProvidersController } from './providers.controller';

// Provider module
export { AiProvidersModule } from './providers.module';
