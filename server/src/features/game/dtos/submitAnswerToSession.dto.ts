import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsString, IsUUID, Max, Min, MinLength } from 'class-validator';

import { VALIDATION_COUNT } from '@shared/constants';

export class SubmitAnswerToSessionDto {
	@ApiProperty({
		description: 'Unique game session ID',
		example: '550e8400-e29b-41d4-a716-446655440000',
	})
	@IsString()
	@IsUUID()
	@MinLength(1)
	gameId!: string;

	@ApiProperty({
		description: 'Question ID',
		example: '550e8400-e29b-41d4-a716-446655440001',
	})
	@IsString()
	@IsUUID()
	@MinLength(1)
	questionId!: string;

	@ApiProperty({
		description: 'Selected answer index (0-based)',
		minimum: 0,
		maximum: VALIDATION_COUNT.ANSWER_COUNT.MAX - 1,
	})
	@Type(() => Number)
	@IsInt()
	@Min(0)
	@Max(VALIDATION_COUNT.ANSWER_COUNT.MAX - 1)
	answer!: number;

	@ApiProperty({ description: 'Time spent on question in seconds', minimum: 0 })
	@Type(() => Number)
	@IsNumber()
	@Min(0)
	timeSpent!: number;
}
