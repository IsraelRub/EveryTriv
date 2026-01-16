import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule as CommonAuthModule } from 'src/common/auth';
import { AuthGuard, RolesGuard } from 'src/common/guards';

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
	providers: [AuthService, GoogleStrategy, AuthGuard, RolesGuard],
	exports: [AuthService, GoogleStrategy, AuthGuard, RolesGuard, PassportModule],
})
export class AuthModule {}
