import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsString, IsUUID, Length, Matches, Max, Min, MinLength } from 'class-validator';

export class MultiplayerSubmitAnswerDto {
	@ApiProperty({
		description: 'Room ID (8 alphanumeric characters)',
		example: 'ABC12345',
	})
	@IsString()
	@Length(8, 8)
	@Matches(/^[A-Z0-9]{8}$/, {
		message: 'Room ID must be exactly 8 alphanumeric characters (A-Z, 0-9)',
	})
	roomId!: string;

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
		maximum: 3,
	})
	@IsInt()
	@Min(0)
	@Max(3)
	answer!: number;

	@ApiProperty({ description: 'Time spent on question in seconds', minimum: 0 })
	@IsNumber()
	@Min(0)
	timeSpent!: number;
}
