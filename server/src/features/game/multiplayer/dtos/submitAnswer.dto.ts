import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsString, IsUUID, Max, Min, MinLength } from 'class-validator';

/**
 * DTO for submitting an answer in multiplayer game
 * @class SubmitAnswerDto
 * @description Data transfer object for submitting an answer to a question in multiplayer game
 */
export class SubmitAnswerDto {
	@ApiProperty({ description: 'Room ID', example: '550e8400-e29b-41d4-a716-446655440000' })
	@IsString()
	@IsUUID()
	@MinLength(1)
	roomId!: string;

	@ApiProperty({ description: 'Question ID', example: '550e8400-e29b-41d4-a716-446655440001' })
	@IsString()
	@IsUUID()
	@MinLength(1)
	questionId!: string;

	@ApiProperty({ description: 'Selected answer index (0-based)', example: 2, minimum: 0, maximum: 3 })
	@IsInt()
	@Min(0)
	@Max(3)
	answer!: number;

	@ApiProperty({ description: 'Time spent on question in seconds', example: 15.5, minimum: 0 })
	@IsNumber()
	@Min(0)
	timeSpent!: number;
}
