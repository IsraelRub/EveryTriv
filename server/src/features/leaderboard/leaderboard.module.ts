/**
 * Leaderboard Module
 *
 * @module LeaderboardModule
 * @description Module for managing user rankings and leaderboard functionality
 * @used_by server/app, server/features/analytics
 * @dependencies TypeOrmModule, CacheModule
 * @provides LeaderboardService
 * @entities LeaderboardEntity, UserEntity, GameHistoryEntity
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameHistoryEntity, LeaderboardEntity, UserEntity, UserStatsEntity } from 'src/internal/entities';
import { CacheModule } from 'src/internal/modules';

import { AuthModule } from '../auth/auth.module';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardService } from './leaderboard.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([LeaderboardEntity, UserEntity, UserStatsEntity, GameHistoryEntity]),
		CacheModule,
		AuthModule,
	],
	controllers: [LeaderboardController],
	providers: [LeaderboardService],
	exports: [LeaderboardService],
})
export class LeaderboardModule {}
