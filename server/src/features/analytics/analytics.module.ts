import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GameHistoryEntity, PaymentHistoryEntity, TriviaEntity, UserEntity, UserStatsEntity } from '@internal/entities';
import { CacheModule } from '@internal/modules';

import { AuthModule } from '../auth';
import { AnalyticsController } from './analytics.controller';
import {
	AnalyticsCommonService,
	AnalyticsTrackerService,
	BusinessAnalyticsService,
	GlobalAnalyticsService,
	LeaderboardAnalyticsService,
	SystemAnalyticsService,
	UserAnalyticsService,
	UserStatsUpdateService,
} from './services';

@Module({
	imports: [
		TypeOrmModule.forFeature([UserEntity, UserStatsEntity, GameHistoryEntity, TriviaEntity, PaymentHistoryEntity]),
		CacheModule,
		AuthModule,
	],
	controllers: [AnalyticsController],
	providers: [
		AnalyticsCommonService,
		UserAnalyticsService,
		GlobalAnalyticsService,
		BusinessAnalyticsService,
		SystemAnalyticsService,
		AnalyticsTrackerService,
		LeaderboardAnalyticsService,
		UserStatsUpdateService,
	],
	exports: [
		UserAnalyticsService,
		GlobalAnalyticsService,
		BusinessAnalyticsService,
		SystemAnalyticsService,
		AnalyticsTrackerService,
		LeaderboardAnalyticsService,
		UserStatsUpdateService,
	],
})
export class AnalyticsModule {}
