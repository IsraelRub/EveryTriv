import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
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
	ScoreResetScheduler,
	SystemAnalyticsService,
	UserAnalyticsService,
} from './services';

@Module({
	imports: [
		ScheduleModule.forRoot(),
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
		ScoreResetScheduler,
	],
	exports: [
		UserAnalyticsService,
		GlobalAnalyticsService,
		BusinessAnalyticsService,
		SystemAnalyticsService,
		AnalyticsTrackerService,
		LeaderboardAnalyticsService,
	],
})
export class AnalyticsModule {}
