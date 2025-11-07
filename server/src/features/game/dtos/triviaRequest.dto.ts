import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

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

	@ApiProperty({ description: 'Number of requested questions' })
	@IsInt()
	@Min(1)
	@Max(50)
	questionCount!: number;
}
