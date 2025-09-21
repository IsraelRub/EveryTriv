/**
 * Auth Module
 *
 * @module AuthModule
 * @description authentication module with login, register, guards, and OAuth
 * @used_by server/src/app, server/src/controllers
 */
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AUTH_CONSTANTS } from '@shared';
import { AuthenticationManager, JwtTokenService, PasswordService } from 'src/common/auth';
import { AuthGuard, RolesGuard } from 'src/common/guards';
import { UserEntity } from 'src/internal/entities';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleStrategy } from './google.strategy';

@Module({
	imports: [
		TypeOrmModule.forFeature([UserEntity]),
		PassportModule,
		JwtModule.register({
			secret: AUTH_CONSTANTS.JWT_SECRET,
			signOptions: { expiresIn: AUTH_CONSTANTS.JWT_EXPIRATION },
		}),
	],
	controllers: [AuthController],
	providers: [
		AuthService,
		GoogleStrategy,
		AuthenticationManager,
		PasswordService,
		JwtTokenService,
		AuthGuard,
		RolesGuard,
	],
	exports: [
		AuthService,
		GoogleStrategy,
		AuthenticationManager,
		PasswordService,
		JwtTokenService,
		AuthGuard,
		RolesGuard,
		PassportModule,
		JwtModule,
	],
})
export class AuthModule {}
