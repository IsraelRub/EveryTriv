import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class ValidateCustomDifficultyDto {
	@ApiProperty({ description: 'Custom difficulty free text' })
	@IsString()
	@MinLength(2)
	@MaxLength(200)
	customText!: string;
}
