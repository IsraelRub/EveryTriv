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

import { LoggerService } from '../../shared/controllers';
import { GameHistoryEntity, PaymentHistoryEntity, TriviaEntity, UserEntity } from '../../shared/entities';
import { CacheModule } from '../../shared/modules';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
	imports: [TypeOrmModule.forFeature([UserEntity, GameHistoryEntity, TriviaEntity, PaymentHistoryEntity]), CacheModule],
	controllers: [AnalyticsController],
	providers: [AnalyticsService, LoggerService],
	exports: [AnalyticsService],
})
export class AnalyticsModule {}
