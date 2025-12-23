/**
 * Auth Module
 *
 * @module AuthModule
 * @description authentication module with login, register, guards, and OAuth
 * @used_by server/src/app, server/src/controllers
 */
import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthenticationManager, JwtTokenService, PasswordService } from 'src/common/auth';
import { AuthGuard, RolesGuard } from 'src/common/guards';

import { AUTH_CONSTANTS } from '@internal/constants';
import { UserEntity } from '@internal/entities';
import { CacheModule } from '@internal/modules/cache/cache.module';
import { StorageModule } from '@internal/modules/storage/storage.module';

import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleStrategy } from './google.strategy';
import { AdminBootstrapService } from './services/adminBootstrap.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([UserEntity]),
		PassportModule,
		JwtModule.register({
			secret: AUTH_CONSTANTS.JWT_SECRET,
			signOptions: { expiresIn: AUTH_CONSTANTS.JWT_EXPIRATION },
		}),
		forwardRef(() => UserModule),
		CacheModule,
		StorageModule,
	],
	controllers: [AuthController],
	providers: [
		AuthService,
		GoogleStrategy,
		AdminBootstrapService,
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
