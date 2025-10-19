/**
 * Analytics Module
 *
 * @module AnalyticsModule
 * @description Analytics and metrics collection module for game statistics and user behavior tracking
 * @used_by server/src/app, server/src/features/game, server/src/controllers
 * @dependencies TypeOrmModule, CacheModule
 * @provides AnalyticsService
 * @entities UserEntity, GameHistoryEntity, TriviaEntity, PaymentHistoryEntity
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
	GameHistoryEntity,
	PaymentHistoryEntity,
	TriviaEntity,
	UserEntity,
	UserStatsEntity,
} from 'src/internal/entities';
import { CacheModule } from 'src/internal/modules';

import { ValidationModule } from '../../common';
import { AuthModule } from '../auth';
import { LeaderboardModule } from '../leaderboard';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([UserEntity, UserStatsEntity, GameHistoryEntity, TriviaEntity, PaymentHistoryEntity]),
		CacheModule,
		ValidationModule,
		AuthModule,
		LeaderboardModule,
	],
	controllers: [AnalyticsController],
	providers: [AnalyticsService],
	exports: [AnalyticsService],
})
export class AnalyticsModule {}
