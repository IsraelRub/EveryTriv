import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

import { DifficultyLevel, GameMode, VALID_GAME_MODES, VALIDATION_CONFIG } from '@shared/constants';
import type { GameDifficulty } from '@shared/types';

/**
 * DTO for creating a multiplayer room
 * @class CreateRoomDto
 * @description Data transfer object for creating a new multiplayer game room
 */
export class CreateRoomDto {
	@ApiProperty({ description: 'Trivia topic', example: 'Science' })
	@IsString()
	@MinLength(2)
	@MaxLength(100)
	topic!: string;

	@ApiProperty({ description: 'Difficulty level (standard or custom)', example: 'medium' })
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
		description: `Number of questions per request (${VALIDATION_CONFIG.limits.QUESTIONS.MIN}-${VALIDATION_CONFIG.limits.QUESTIONS.MAX})`,
		example: 10,
		minimum: VALIDATION_CONFIG.limits.QUESTIONS.MIN,
		maximum: VALIDATION_CONFIG.limits.QUESTIONS.MAX,
	})
	@IsInt()
	@Min(VALIDATION_CONFIG.limits.QUESTIONS.MIN)
	@Max(VALIDATION_CONFIG.limits.QUESTIONS.MAX)
	questionsPerRequest!: number;

	@ApiProperty({
		description: `Maximum number of players (${VALIDATION_CONFIG.limits.PLAYERS.MIN}-${VALIDATION_CONFIG.limits.PLAYERS.MAX})`,
		example: VALIDATION_CONFIG.limits.PLAYERS.MAX,
		minimum: VALIDATION_CONFIG.limits.PLAYERS.MIN,
		maximum: VALIDATION_CONFIG.limits.PLAYERS.MAX,
	})
	@IsInt()
	@Min(VALIDATION_CONFIG.limits.PLAYERS.MIN)
	@Max(VALIDATION_CONFIG.limits.PLAYERS.MAX)
	maxPlayers!: number;

	@ApiProperty({ description: 'Game mode', enum: VALID_GAME_MODES, example: GameMode.QUESTION_LIMITED })
	@IsEnum(GameMode)
	gameMode!: GameMode;
}
