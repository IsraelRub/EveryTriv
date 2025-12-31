/**
 * Game Module
 *
 * @module GameModule
 * @description Core game module handling trivia game logic, scoring, and AI providers management
 * @used_by server/app, server/src/controllers
 * @dependencies TypeOrmModule, AnalyticsModule, CacheModule, StorageModule, UserModule
 * @provides GameService
 * @entities UserEntity, GameHistoryEntity, TriviaEntity
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GameHistoryEntity, TriviaEntity, UserEntity, UserStatsEntity } from '@internal/entities';
import { CacheModule, StorageModule } from '@internal/modules';
import { CustomDifficultyPipe, GameAnswerPipe, TriviaRequestPipe } from '../../common/pipes';
import { ValidationModule } from '../../common/validation/validation.module';
import { AnalyticsModule } from '../analytics';
import { AuthModule } from '../auth';
import { LeaderboardModule } from '../leaderboard';
import { UserModule } from '../user';
import { AiProvidersController } from './aiProviders.controller';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { TriviaGenerationService } from './logic/triviaGeneration.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([UserEntity, UserStatsEntity, GameHistoryEntity, TriviaEntity]),
		AnalyticsModule,
		AuthModule,
		LeaderboardModule,
		CacheModule,
		StorageModule,
		ValidationModule,
		UserModule,
	],
	controllers: [GameController, AiProvidersController],
	providers: [
		GameService,
		TriviaGenerationService,
		CustomDifficultyPipe,
		GameAnswerPipe,
		TriviaRequestPipe,
	],
	exports: [GameService],
})
export class GameModule {}
