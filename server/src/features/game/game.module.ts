import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CustomDifficultyPipe, StartGameSessionPipe, TriviaRequestPipe } from '@common/pipes';
import { ValidationModule } from '@common/validation';
import { GameHistoryEntity, TriviaEntity, UserEntity, UserStatsEntity } from '@internal/entities';
import { CacheModule, StorageModule } from '@internal/modules';

import { AnalyticsModule } from '../analytics';
import { AuthModule } from '../auth';
import { UserModule } from '../user';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { AiProvidersController } from './triviaGeneration/aiProviders.controller';
import { TriviaGenerationService } from './triviaGeneration/triviaGeneration.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([UserEntity, UserStatsEntity, GameHistoryEntity, TriviaEntity]),
		forwardRef(() => AnalyticsModule),
		AuthModule,
		CacheModule,
		StorageModule,
		UserModule,
		ValidationModule,
	],
	controllers: [GameController, AiProvidersController],
	providers: [GameService, TriviaGenerationService, CustomDifficultyPipe, TriviaRequestPipe, StartGameSessionPipe],
	exports: [GameService],
})
export class GameModule {}
