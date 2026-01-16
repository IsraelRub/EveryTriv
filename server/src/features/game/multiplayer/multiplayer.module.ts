import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AUTH_CONSTANTS } from '@shared/constants';

import { AppConfig } from '@config';
import { UserEntity } from '@internal/entities';
import { CacheModule, StorageModule } from '@internal/modules';

import { WsAuthGuard } from '../../../common/guards';
import { GameModule } from '../game.module';
import { GameStateService } from './gameState.service';
import { MultiplayerController } from './multiplayer.controller';
import { MultiplayerGateway } from './multiplayer.gateway';
import { MultiplayerService } from './multiplayer.service';
import { QuestionSchedulerService } from './questionScheduler.service';
import { RoomService } from './room.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([UserEntity]),
		CacheModule,
		StorageModule,
		GameModule, // Import GameModule to use GameService
		JwtModule.register({
			secret: AppConfig.jwt.secret,
			signOptions: { expiresIn: AUTH_CONSTANTS.JWT_EXPIRATION },
		}),
	],
	providers: [
		RoomService,
		GameStateService,
		MultiplayerService,
		MultiplayerGateway,
		QuestionSchedulerService,
		WsAuthGuard,
	],
	controllers: [MultiplayerController],
	exports: [MultiplayerService, MultiplayerGateway, GameStateService],
})
export class MultiplayerModule {}
