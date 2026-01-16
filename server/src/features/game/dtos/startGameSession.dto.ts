import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsUUID, MinLength } from 'class-validator';

import { GameMode } from '@shared/constants';
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

	@ApiProperty({ description: 'Game topic', example: 'Science' })
	@IsString()
	@MinLength(1)
	topic!: string;

	@ApiProperty({ description: 'Game difficulty', example: 'medium' })
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
