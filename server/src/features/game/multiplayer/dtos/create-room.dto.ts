import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

import { GameMode, VALID_GAME_MODES } from '@shared/constants';
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

	@ApiProperty({ description: 'Number of questions requested (1-50)', example: 10, minimum: 1, maximum: 50 })
	@IsInt()
	@Min(1)
	@Max(50)
	requestedQuestions!: number;

	@ApiProperty({ description: 'Maximum number of players (2-4)', example: 4, minimum: 2, maximum: 4 })
	@IsInt()
	@Min(2)
	@Max(4)
	maxPlayers!: number;

	@ApiProperty({ description: 'Game mode', enum: VALID_GAME_MODES, example: GameMode.QUESTION_LIMITED })
	@IsEnum(GameMode)
	gameMode!: GameMode;
}
