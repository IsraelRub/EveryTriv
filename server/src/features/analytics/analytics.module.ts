/**
 * Analytics Module
 *
 * @module AnalyticsModule
 * @description Analytics and metrics collection module for game statistics and user behavior tracking
 * @used_by server/app, server/features/game, server/controllers
 * @dependencies TypeOrmModule, CacheModule
 * @provides AnalyticsService
 * @entities UserEntity, GameHistoryEntity, TriviaEntity, PaymentHistoryEntity
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ValidationModule } from '../../common';
import { GameHistoryEntity, PaymentHistoryEntity, TriviaEntity, UserEntity, UserStatsEntity } from 'src/internal/entities';

import { CacheModule } from 'src/internal/modules';
import { AuthModule } from '../auth/auth.module';
import { LeaderboardModule } from '../leaderboard/leaderboard.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([UserEntity, UserStatsEntity, GameHistoryEntity, TriviaEntity, PaymentHistoryEntity]), 
		CacheModule,
		ValidationModule,
		AuthModule,
		LeaderboardModule
	],
	controllers: [AnalyticsController],
	providers: [AnalyticsService],
	exports: [AnalyticsService],
})
export class AnalyticsModule {}
