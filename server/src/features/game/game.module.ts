/**
 * Game Module
 *
 * @module GameModule
 * @description Core game module handling trivia game logic, scoring, and AI providers management
 * @used_by server/app, server/src/controllers
 * @dependencies TypeOrmModule, AnalyticsModule, CacheModule, StorageModule, UserModule
 * @provides GameService, AiProvidersService
 * @entities UserEntity, GameHistoryEntity, TriviaEntity
 */
import { GameHistoryEntity, TriviaEntity, UserEntity, UserStatsEntity } from 'src/internal/entities';
import { CacheModule, StorageModule } from 'src/internal/modules';

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PointCalculationService } from '../../../../shared/services/points/pointCalculation.service';
import {
	CustomDifficultyPipe,
	GameAnswerPipe,
	LanguageValidationPipe,
	TriviaQuestionPipe,
	TriviaRequestPipe,
} from '../../common/pipes';
import { ValidationModule } from '../../common/validation/validation.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { AiProvidersController, AiProvidersService } from './logic/providers/management';
import { TriviaGenerationService } from './logic/triviaGeneration.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([UserEntity, UserStatsEntity, GameHistoryEntity, TriviaEntity]),
		AnalyticsModule,
		AuthModule,
		CacheModule,
		StorageModule,
		ValidationModule,
		UserModule,
	],
	controllers: [GameController, AiProvidersController],
	providers: [
		GameService,
		TriviaGenerationService,
		AiProvidersService,
		PointCalculationService,
		CustomDifficultyPipe,
		TriviaQuestionPipe,
		GameAnswerPipe,
		TriviaRequestPipe,
		LanguageValidationPipe,
	],
	exports: [GameService, AiProvidersService],
})
export class GameModule {}
