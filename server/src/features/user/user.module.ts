/**
 * User Module
 *
 * @module UserModule
 * @description User management module handling user authentication, profiles, and account operations
 * @used_by server/app, server/controllers
 * @dependencies TypeOrmModule, JwtModule, AuthSharedModule, CacheModule, LoggerModule, StorageModule
 * @provides UserService
 * @entities UserEntity
 */
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AUTH_CONSTANTS } from '../../shared/constants';
import { LoggerService } from '../../shared/controllers';
import { UserEntity } from '../../shared/entities';
import { AuthSharedModule, CacheModule, StorageModule } from '../../shared/modules';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([UserEntity]),
		AuthSharedModule,
		CacheModule,
		StorageModule,
		JwtModule.register({
			secret: AUTH_CONSTANTS.JWT_SECRET,
			signOptions: { expiresIn: AUTH_CONSTANTS.JWT_EXPIRATION },
		}),
	],
	controllers: [UserController],
	providers: [UserService, LoggerService],
	exports: [UserService],
})
export class UserModule {}
