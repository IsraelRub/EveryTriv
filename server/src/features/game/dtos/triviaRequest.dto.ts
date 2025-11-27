import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

import { VALIDATION_LIMITS } from '@shared/constants';
import type { GameDifficulty } from '@shared/types';

export class TriviaRequestDto {
	@ApiProperty({ description: 'Trivia topic' })
	@IsString()
	@MinLength(2)
	@MaxLength(100)
	topic!: string;

	@ApiProperty({ description: 'Difficulty level (standard or custom)' })
	@IsString()
	difficulty!: GameDifficulty;

	@ApiProperty({
		description:
			'Number of requested questions (999 for unlimited mode). See VALIDATION_LIMITS.REQUESTED_QUESTIONS.UNLIMITED for explanation of why 999 is used instead of Infinity or a string.',
		minimum: VALIDATION_LIMITS.REQUESTED_QUESTIONS.MIN,
		maximum: VALIDATION_LIMITS.REQUESTED_QUESTIONS.UNLIMITED,
		example: 10,
	})
	@IsInt()
	@Min(VALIDATION_LIMITS.REQUESTED_QUESTIONS.MIN)
	@Max(VALIDATION_LIMITS.REQUESTED_QUESTIONS.UNLIMITED)
	requestedQuestions!: number;

	@ApiPropertyOptional({ description: 'Optional category for the trivia questions' })
	@IsOptional()
	@IsString()
	@MaxLength(100)
	category?: string;

	@ApiPropertyOptional({ description: 'Optional user identifier (for personalization)' })
	@IsOptional()
	@IsString()
	userId?: string;

	@ApiPropertyOptional({ description: 'Optional game mode associated with this trivia request' })
	@IsOptional()
	@IsString()
	gameMode?: string;

	@ApiPropertyOptional({ description: 'Optional time limit per question in seconds. Undefined means no time limit.' })
	@IsOptional()
	@IsInt()
	@Max(3600)
	timeLimit?: number;

	@ApiPropertyOptional({ description: 'Optional maximum number of questions for the session' })
	@IsOptional()
	@IsInt()
	@Min(1)
	@Max(100)
	questionLimit?: number;
}
