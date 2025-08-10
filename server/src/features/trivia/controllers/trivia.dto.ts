import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsIn,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsBoolean,
  ValidateIf,
  Matches,
} from "class-validator";
import { Type } from "class-transformer";

// Import shared constants
import { 
  VALID_DIFFICULTIES, 
  VALID_QUESTION_COUNTS, 
  VALIDATION_LIMITS 
} from '../../../../../shared/constants/game.constants';

export class TriviaAnswerDto {
  @IsString()
  text: string = '';

  @IsBoolean()
  isCorrect: boolean = false;
}

export class TriviaRequestDto {
  @IsString()
  @MinLength(VALIDATION_LIMITS.TOPIC.MIN_LENGTH)
  @MaxLength(VALIDATION_LIMITS.TOPIC.MAX_LENGTH)
  topic: string = '';

  @IsString()
  @ValidateIf((o) => !o.difficulty.startsWith('custom:'))
  @IsIn(VALID_DIFFICULTIES.filter(d => d !== 'custom'))
  difficulty: string = 'medium';

  @IsString()
  @ValidateIf((o) => o.difficulty.startsWith('custom:'))
  @Matches(/^custom:.+/)
  @MinLength(VALIDATION_LIMITS.CUSTOM_DIFFICULTY.MIN_LENGTH + 7) // "custom:" + min length
  @MaxLength(VALIDATION_LIMITS.CUSTOM_DIFFICULTY.MAX_LENGTH + 7) // "custom:" + max length
  customDifficulty?: string;

  @IsNumber()
  @IsIn(VALID_QUESTION_COUNTS)
  questionCount: number = 3;

  @IsString()
  @IsOptional()
  userId?: string;
}

export class TriviaHistoryDto {
  @IsString()
  userId: string = '';

  @IsString()
  question: string = '';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TriviaAnswerDto)
  answers: TriviaAnswerDto[] = [];

  @IsNumber()
  @Min(0)
  correctAnswerIndex: number = 0;

  @IsBoolean()
  isCorrect: boolean = false;

  @IsString()
  topic: string = '';

  @IsString()
  difficulty: string = 'medium';
}