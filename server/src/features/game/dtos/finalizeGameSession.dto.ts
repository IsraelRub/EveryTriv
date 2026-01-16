import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MinLength } from 'class-validator';

export class FinalizeGameSessionDto {
	@ApiProperty({
		description: 'Unique game session ID',
		example: '550e8400-e29b-41d4-a716-446655440000',
	})
	@IsString()
	@IsUUID()
	@MinLength(1)
	gameId!: string;
}
