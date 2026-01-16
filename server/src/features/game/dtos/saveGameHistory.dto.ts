import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsString, IsUUID, Min, ValidateNested } from 'class-validator';

import { DifficultyLevel, GameMode } from '@shared/constants';
import type { GameDifficulty, QuestionData } from '@shared/types';

export class SaveGameHistoryDto {
	@ApiProperty({
		description: 'User ID',
		example: '550e8400-e29b-41d4-a716-446655440000',
	})
	@IsString()
	@IsUUID()
	@IsNotEmpty()
	userId!: string;

	@ApiProperty({
		description: 'Game score',
		example: 100,
		minimum: 0,
	})
	@IsNumber()
	@Min(0)
	score!: number;

	@ApiProperty({
		description: 'Number of questions in the game',
		example: 10,
		minimum: 1,
	})
	@IsNumber()
	@Min(1)
	gameQuestionCount!: number;

	@ApiProperty({
		description: 'Number of correct answers',
		example: 8,
		minimum: 0,
	})
	@IsNumber()
	@Min(0)
	correctAnswers!: number;

	@ApiProperty({
		description: 'Game difficulty',
		enum: DifficultyLevel,
		example: DifficultyLevel.MEDIUM,
	})
	@IsString()
	@IsNotEmpty()
	difficulty!: GameDifficulty;

	@ApiProperty({
		description: 'Game topic',
		example: 'Science',
	})
	@IsString()
	@IsNotEmpty()
	topic!: string;

	@ApiProperty({
		description: 'Game mode',
		enum: GameMode,
		example: GameMode.QUESTION_LIMITED,
	})
	@IsEnum(GameMode)
	gameMode!: GameMode;

	@ApiProperty({
		description: 'Time spent in seconds',
		example: 300,
		minimum: 0,
	})
	@IsNumber()
	@Min(0)
	timeSpent!: number;

	@ApiProperty({
		description: 'Credits used',
		example: 10,
		minimum: 0,
	})
	@IsNumber()
	@Min(0)
	creditsUsed!: number;

	@ApiProperty({
		description: 'Questions data',
		type: 'array',
		items: { type: 'object' },
	})
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => Object)
	questionsData!: QuestionData[];

	@ApiProperty({
		description: 'Client mutation ID for idempotency (required)',
		example: '550e8400-e29b-41d4-a716-446655440000',
	})
	@IsString()
	@IsUUID()
	@IsNotEmpty()
	clientMutationId!: string;
}
