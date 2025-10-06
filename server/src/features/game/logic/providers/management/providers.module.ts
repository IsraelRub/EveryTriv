import { AuthModule } from '@features/auth';

import { Module } from '@nestjs/common';

import { AiProvidersController } from './providers.controller';
import { AiProvidersService } from './providers.service';

/**
 * Module for AI providers management
 * Handles different AI service providers (OpenAI, Anthropic, Google, etc.)
 */
@Module({
	imports: [AuthModule],
	controllers: [AiProvidersController],
	providers: [AiProvidersService],
	exports: [AiProvidersService],
})
export class AiProvidersModule {}
