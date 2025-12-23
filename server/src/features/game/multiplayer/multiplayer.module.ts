import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AUTH_CONSTANTS } from '@internal/constants';
import { UserEntity } from '@internal/entities';
import { CacheModule, StorageModule } from '@internal/modules';

import { WsAuthGuard } from '../../../common/guards';
import { GameModule } from '../game.module';
import { GameStateService } from './gameState.service';
import { MatchmakingService } from './matchmaking.service';
import { MultiplayerController } from './multiplayer.controller';
import { MultiplayerGateway } from './multiplayer.gateway';
import { MultiplayerService } from './multiplayer.service';
import { RoomService } from './room.service';

/**
 * Multiplayer Module
 * @module MultiplayerModule
 * @description Module for multiplayer simultaneous trivia games
 */
@Module({
	imports: [
		TypeOrmModule.forFeature([UserEntity]),
		CacheModule,
		StorageModule,
		GameModule, // Import GameModule to use GameService
		JwtModule.register({
			secret: AUTH_CONSTANTS.JWT_SECRET,
			signOptions: { expiresIn: AUTH_CONSTANTS.JWT_EXPIRATION },
		}),
	],
	providers: [RoomService, GameStateService, MatchmakingService, MultiplayerService, MultiplayerGateway, WsAuthGuard],
	controllers: [MultiplayerController],
	exports: [MultiplayerService, MultiplayerGateway],
})
export class MultiplayerModule {}
