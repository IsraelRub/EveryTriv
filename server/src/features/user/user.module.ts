/**
 * User Module
 *
 * @module UserModule
 * @description User management module handling user authentication, profiles, and account operations
 * @used_by server/app, server/controllers
 * @dependencies TypeOrmModule, JwtModule, AuthModule, CacheModule, LoggerModule, StorageModule
 * @provides UserService
 * @entities UserEntity
 */
import { AuthModule } from '@features/auth';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthenticationManager, PasswordService } from 'src/common/auth';
import { GameHistoryEntity, UserEntity, UserStatsEntity } from 'src/internal/entities';
import { CacheModule, StorageModule } from 'src/internal/modules';

import { UserDataPipe } from '../../common/pipes';
import { ValidationModule } from '../../common/validation/validation.module';
import { AUTH_CONSTANTS } from '../../internal/constants/auth/auth.constants';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserStatsService } from './userStats.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([UserEntity, UserStatsEntity, GameHistoryEntity]),
		AuthModule,
		CacheModule,
		StorageModule,
		ValidationModule,
		JwtModule.register({
			secret: AUTH_CONSTANTS.JWT_SECRET,
			signOptions: { expiresIn: AUTH_CONSTANTS.JWT_EXPIRATION },
		}),
	],
	controllers: [UserController],
	providers: [UserService, UserStatsService, UserDataPipe, AuthenticationManager, PasswordService],
	exports: [UserService, UserStatsService],
})
export class UserModule {}
