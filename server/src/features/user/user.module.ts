import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule as CommonAuthModule } from 'src/common/auth';

import { GameHistoryEntity, UserEntity, UserStatsEntity } from '@internal/entities';
import { CacheModule, StorageModule, UserCoreModule } from '@internal/modules';

import { UserDataPipe } from '../../common/pipes';
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
		StorageModule,
	],
	controllers: [UserController],
	providers: [UserService, UserDataPipe],
	exports: [UserService],
})
export class UserModule {}
