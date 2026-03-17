import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CommonAuthModule } from '@common/auth';
import { UserDataPipe } from '@common/pipes';
import { GameHistoryEntity, UserEntity, UserStatsEntity } from '@internal/entities';
import { CacheModule, UserCoreModule } from '@internal/modules';

import { AuthModule } from '../auth';
import { CreditsModule } from '../credits';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
	imports: [
		CommonAuthModule,
		AuthModule,
		TypeOrmModule.forFeature([UserEntity, UserStatsEntity, GameHistoryEntity]),
		UserCoreModule,
		CreditsModule,
		CacheModule,
	],
	controllers: [UserController],
	providers: [UserService, UserDataPipe],
	exports: [UserService],
})
export class UserModule {}
