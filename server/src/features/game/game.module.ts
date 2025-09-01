/**
 * Game Module
 *
 * @module GameModule
 * @description Core game module handling trivia game logic, scoring, and AI providers management
 * @used_by server/app, server/controllers
 * @dependencies TypeOrmModule, AnalyticsModule, CacheModule, StorageModule
 * @provides GameService, ScoringService, AiProvidersService
 * @entities UserEntity, GameHistoryEntity, TriviaEntity
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ValidationService } from '../../common';
import { LoggerService } from '../../shared/controllers';
import { GameHistoryEntity } from '../../shared/entities/gameHistory.entity';
import { TriviaEntity } from '../../shared/entities/trivia.entity';
import { UserEntity } from '../../shared/entities/user.entity';
import { CacheModule, StorageModule } from '../../shared/modules';
import { AnalyticsModule } from '../analytics/analytics.module';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { AiProvidersService } from './logic/providers/management';
import { ScoringService } from './logic/scoring';
import { TriviaGenerationService } from './logic/triviaGeneration.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([UserEntity, GameHistoryEntity, TriviaEntity]),
		AnalyticsModule,
		CacheModule,
		StorageModule,
	],
	controllers: [GameController],
	providers: [
		GameService,
		TriviaGenerationService,
		ScoringService,
		AiProvidersService,
		ValidationService,
		LoggerService,
	],
	exports: [GameService, ScoringService, AiProvidersService],
})
export class GameModule {}
