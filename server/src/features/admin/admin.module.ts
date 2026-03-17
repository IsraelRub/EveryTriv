import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CommonAuthModule } from '@common/auth';
import { GameHistoryEntity, TriviaEntity, UserEntity, UserStatsEntity } from '@internal/entities';
import { CacheModule } from '@internal/modules';

import { AnalyticsModule } from '../analytics';
import { CreditsModule } from '../credits';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminBootstrapService } from './adminBootstrap.service';

@Module({
	imports: [
		CommonAuthModule,
		TypeOrmModule.forFeature([GameHistoryEntity, TriviaEntity, UserStatsEntity, UserEntity]),
		CacheModule,
		AnalyticsModule,
		CreditsModule,
	],
	controllers: [AdminController],
	providers: [AdminService, AdminBootstrapService],
	exports: [AdminService],
})
export class AdminModule {}
