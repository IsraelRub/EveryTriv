import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

import {
	DEFAULT_GAME_CONFIG,
	DifficultyLevel,
	GAME_MODES,
	GameMode,
	VALIDATION_COUNT,
	VALIDATION_LENGTH,
} from '@shared/constants';
import type { GameDifficulty } from '@shared/types';

export class CreateRoomDto {
	@ApiProperty({ description: 'Trivia topic', example: DEFAULT_GAME_CONFIG.defaultTopic })
	@IsString()
	@MinLength(VALIDATION_LENGTH.TOPIC.MIN)
	@MaxLength(VALIDATION_LENGTH.TOPIC.MAX)
	topic!: string;

	@ApiProperty({
		description: 'Difficulty level (standard or custom)',
		example: DEFAULT_GAME_CONFIG.defaultDifficulty,
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

	@ApiProperty({ description: 'Game mode', enum: [...GAME_MODES] })
	@IsEnum(GameMode)
	gameMode!: GameMode;

	@ApiPropertyOptional({
		description: `Number of answer choices per question (${VALIDATION_COUNT.ANSWER_COUNT.MIN}-${VALIDATION_COUNT.ANSWER_COUNT.MAX})`,
		minimum: VALIDATION_COUNT.ANSWER_COUNT.MIN,
		maximum: VALIDATION_COUNT.ANSWER_COUNT.MAX,
	})
	@IsOptional()
	@IsInt()
	@Min(VALIDATION_COUNT.ANSWER_COUNT.MIN)
	@Max(VALIDATION_COUNT.ANSWER_COUNT.MAX)
	answerCount?: number;
}
