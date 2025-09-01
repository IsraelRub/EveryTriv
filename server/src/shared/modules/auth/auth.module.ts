/**
 * Authentication Shared Module
 *
 * @module AuthSharedModule
 * @description Shared authentication module providing common auth services and guards for other modules
 * @used_by server/features/user, server/middleware, server/controllers
 * @dependencies PassportModule, LoggerModule
 * @purpose Resolves circular dependencies in authentication flow
 */
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { LoggerService } from '../../controllers';
import { GoogleStrategy } from './google.strategy';

@Module({
	imports: [PassportModule],
	providers: [GoogleStrategy, LoggerService],
	exports: [PassportModule, GoogleStrategy],
})
export class AuthSharedModule {}
