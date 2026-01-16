import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

import { DifficultyLevel, GameMode, VALID_GAME_MODES, VALIDATION_COUNT } from '@shared/constants';
import type { GameDifficulty } from '@shared/types';

export class CreateRoomDto {
	@ApiProperty({ description: 'Trivia topic', example: 'Science' })
	@IsString()
	@MinLength(2)
	@MaxLength(100)
	topic!: string;

	@ApiProperty({
		description: 'Difficulty level (standard or custom)',
		example: 'medium',
	})
	@IsString()
	difficulty!: GameDifficulty;

	@ApiPropertyOptional({
		description: 'Normalized difficulty level (DifficultyLevel enum) - set automatically by pipe',
		enum: DifficultyLevel,
	})
	@IsOptional()
	@IsEnum(DifficultyLevel)
	mappedDifficulty?: DifficultyLevel;

	@ApiProperty({
		description: `Number of questions per request (${VALIDATION_COUNT.QUESTIONS.MIN}-${VALIDATION_COUNT.QUESTIONS.MAX})`,
		minimum: VALIDATION_COUNT.QUESTIONS.MIN,
		maximum: VALIDATION_COUNT.QUESTIONS.MAX,
	})
	@IsInt()
	@Min(VALIDATION_COUNT.QUESTIONS.MIN)
	@Max(VALIDATION_COUNT.QUESTIONS.MAX)
	questionsPerRequest!: number;

	@ApiProperty({
		description: `Maximum number of players (${VALIDATION_COUNT.PLAYERS.MIN}-${VALIDATION_COUNT.PLAYERS.MAX})`,
		minimum: VALIDATION_COUNT.PLAYERS.MIN,
		maximum: VALIDATION_COUNT.PLAYERS.MAX,
	})
	@IsInt()
	@Min(VALIDATION_COUNT.PLAYERS.MIN)
	@Max(VALIDATION_COUNT.PLAYERS.MAX)
	maxPlayers!: number;

	@ApiProperty({ description: 'Game mode', enum: VALID_GAME_MODES })
	@IsEnum(GameMode)
	gameMode!: GameMode;
}
