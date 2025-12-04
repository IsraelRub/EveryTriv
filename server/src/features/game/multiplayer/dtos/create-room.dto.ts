import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

import { GameMode, MULTIPLAYER_VALIDATION, VALID_GAME_MODES, VALIDATION_LIMITS } from '@shared/constants';
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

	@ApiProperty({
		description: `Number of questions per request (${VALIDATION_LIMITS.QUESTIONS.MIN}-${VALIDATION_LIMITS.QUESTIONS.MAX})`,
		example: 10,
		minimum: VALIDATION_LIMITS.QUESTIONS.MIN,
		maximum: VALIDATION_LIMITS.QUESTIONS.MAX,
	})
	@IsInt()
	@Min(VALIDATION_LIMITS.QUESTIONS.MIN)
	@Max(VALIDATION_LIMITS.QUESTIONS.MAX)
	questionsPerRequest!: number;

	@ApiProperty({
		description: `Maximum number of players (${MULTIPLAYER_VALIDATION.MAX_PLAYERS.MIN}-${MULTIPLAYER_VALIDATION.MAX_PLAYERS.MAX})`,
		example: MULTIPLAYER_VALIDATION.MAX_PLAYERS.MAX,
		minimum: MULTIPLAYER_VALIDATION.MAX_PLAYERS.MIN,
		maximum: MULTIPLAYER_VALIDATION.MAX_PLAYERS.MAX,
	})
	@IsInt()
	@Min(MULTIPLAYER_VALIDATION.MAX_PLAYERS.MIN)
	@Max(MULTIPLAYER_VALIDATION.MAX_PLAYERS.MAX)
	maxPlayers!: number;

	@ApiProperty({ description: 'Game mode', enum: VALID_GAME_MODES, example: GameMode.QUESTION_LIMITED })
	@IsEnum(GameMode)
	gameMode!: GameMode;
}
