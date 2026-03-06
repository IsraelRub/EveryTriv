import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsUUID, MinLength } from 'class-validator';

import { DEFAULT_GAME_CONFIG, GameMode } from '@shared/constants';
import type { GameDifficulty } from '@shared/types';

export class StartGameSessionDto {
	@ApiProperty({
		description: 'Unique game ID from client',
		example: '550e8400-e29b-41d4-a716-446655440000',
	})
	@IsString()
	@IsUUID()
	@MinLength(1)
	gameId!: string;

	@ApiProperty({ description: 'Game topic', example: DEFAULT_GAME_CONFIG.defaultTopic })
	@IsString()
	@MinLength(1)
	topic!: string;

	@ApiProperty({ description: 'Game difficulty', example: DEFAULT_GAME_CONFIG.defaultDifficulty })
	@IsString()
	@MinLength(1)
	difficulty!: GameDifficulty;

	@ApiProperty({
		description: 'Game mode',
		enum: GameMode,
		example: GameMode.QUESTION_LIMITED,
	})
	@IsEnum(GameMode)
	gameMode!: GameMode;
}
