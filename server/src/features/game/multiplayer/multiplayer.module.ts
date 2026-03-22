import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppConfig } from '@config';
import { WsAuthGuard } from '@common/guards';
import { ValidationModule } from '@common/validation';
import { AUTH_CONSTANTS } from '@internal/constants';
import { UserEntity } from '@internal/entities';
import { CacheModule, StorageModule } from '@internal/modules';

import { CreditsModule } from '../../credits';
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
		CreditsModule,
		ValidationModule,
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
