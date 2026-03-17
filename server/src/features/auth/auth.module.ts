import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CommonAuthModule } from '@common/auth';
import { LocalAuthGuard, RolesGuard } from '@common/guards';
import { UserEntity } from '@internal/entities';
import { CacheModule, StorageModule, UserCoreModule } from '@internal/modules';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleStrategy } from './google.strategy';

@Module({
	imports: [
		CommonAuthModule,
		TypeOrmModule.forFeature([UserEntity]),
		PassportModule,
		UserCoreModule,
		CacheModule,
		StorageModule,
	],
	controllers: [AuthController],
	providers: [AuthService, GoogleStrategy, LocalAuthGuard, RolesGuard],
	exports: [AuthService, GoogleStrategy, LocalAuthGuard, RolesGuard, PassportModule],
})
export class AuthModule {}
