import { Module } from '@nestjs/common';

import { AuthSharedModule } from '../../../../../shared/modules/auth/auth.module';
import { AiProvidersController } from './providers.controller';
import { AiProvidersService } from './providers.service';

/**
 * Module for AI providers management
 * Handles different AI service providers (OpenAI, Anthropic, Google, etc.)
 */
@Module({
	imports: [AuthSharedModule],
	controllers: [AiProvidersController],
	providers: [AiProvidersService],
	exports: [AiProvidersService],
})
export class AiProvidersModule {}
