import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GameHistoryEntity, TriviaEntity, UserEntity, UserStatsEntity } from '@internal/entities';
import { CacheModule, StorageModule } from '@internal/modules';

import { CustomDifficultyPipe, TriviaRequestPipe } from '../../common/pipes';
import { ValidationModule } from '../../common/validation';
import { AnalyticsModule } from '../analytics';
import { AuthModule } from '../auth';
import { UserModule } from '../user';
import { AiProvidersController } from './aiProviders.controller';
import { GameController } from './game.controller';
import { GameService } from './game.service';
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
	providers: [GameService, TriviaGenerationService, CustomDifficultyPipe, TriviaRequestPipe],
	exports: [GameService],
})
export class GameModule {}
