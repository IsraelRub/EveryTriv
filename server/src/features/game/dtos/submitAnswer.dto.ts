import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Min, MinLength } from 'class-validator';

export class SubmitAnswerDto {
	@ApiProperty({ description: 'Question identifier' })
	@IsString()
	@MinLength(1)
	questionId!: string;

	@ApiProperty({ description: 'Provided answer text' })
	@IsString()
	@MinLength(1)
	answer!: string;

	@ApiProperty({ description: 'Time spent answering in seconds', example: 15.5, minimum: 0 })
	@IsNumber()
	@Min(0)
	timeSpent!: number;
}
