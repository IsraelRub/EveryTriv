import { IsArray, IsOptional, IsString } from 'class-validator';
import {
	CachedQuestionDto as ICachedQuestionDto,
	CacheQuestionsQueryDto as ICacheQuestionsQueryDto,
	CacheQuestionsResponseDto as ICacheQuestionsResponseDto,
} from 'everytriv-shared/types/cache.types';

/**
 * Cached question data DTO with validation
 * Extends the shared interface with validation decorators
 */
export class CachedQuestionDto implements ICachedQuestionDto {
	@IsString()
	question: string;

	@IsArray()
	@IsString({ each: true })
	options: string[];

	@IsString()
	correctAnswer: string;

	@IsString()
	@IsOptional()
	explanation?: string;
}

/**
 * Cache questions query DTO with validation
 * Extends the shared interface with validation decorators
 */
export class CacheQuestionsQueryDto implements ICacheQuestionsQueryDto {
	@IsString()
	topic: string;

	@IsString()
	difficulty: string;

	@IsString()
	@IsOptional()
	language?: string;
}

/**
 * Cache questions response DTO with validation
 * Extends the shared interface with validation decorators
 */
export class CacheQuestionsResponseDto implements ICacheQuestionsResponseDto {
	@IsArray()
	questions: CachedQuestionDto[];

	@IsString()
	topic: string;

	@IsString()
	difficulty: string;

	@IsString()
	language: string;
}
