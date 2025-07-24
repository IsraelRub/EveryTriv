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
} from "class-validator";
import { Type } from "class-transformer";

export class TriviaAnswerDto {
  @IsString()
  text: string;

  @IsBoolean()
  isCorrect: boolean;
}

export class TriviaRequestDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  topic: string;

  @IsString()
  @IsIn(["easy", "medium", "hard"])
  difficulty: string;

  @IsString()
  @IsOptional()
  userId?: string;
}

export class TriviaHistoryDto {
  @IsString()
  userId: string;

  @IsString()
  question: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TriviaAnswerDto)
  answers: TriviaAnswerDto[];

  @IsNumber()
  @Min(0)
  correctAnswerIndex: number;

  @IsBoolean()
  isCorrect: boolean;

  @IsString()
  topic: string;

  @IsString()
  @IsIn(["easy", "medium", "hard"])
  difficulty: string;
}
