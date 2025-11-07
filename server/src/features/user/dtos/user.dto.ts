/**
 * User DTOs
 *
 * @module UserDTOs
 * @description Data Transfer Objects for user management
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
	IsArray,
	IsBoolean,
	IsDateString,
	IsIn,
	IsNotEmpty,
	IsNumber,
	IsObject,
	IsOptional,
	IsString,
	IsUrl,
	Matches,
	Max,
	MaxLength,
	Min,
	MinLength,
	ValidateNested,
} from 'class-validator';

import { UserStatus } from '@shared/constants';
import { BasicValue, CustomDifficultyItem, UserAddress, UserPreferences } from '@shared/types';

export class UpdateUserProfileDto {
	@ApiPropertyOptional({
		description: 'Username',
		example: 'username',
		minLength: 3,
		maxLength: 50,
	})
	@IsOptional()
	@IsString()
	@MinLength(3, { message: 'Username must be at least 3 characters long' })
	@MaxLength(50, { message: 'Username cannot exceed 50 characters' })
	@Matches(/^[a-zA-Z0-9_-]+$/, { message: 'Username can only contain letters, numbers, underscores, and hyphens' })
	username?: string;

	@ApiPropertyOptional({
		description: 'First name',
		example: 'First',
		maxLength: 50,
	})
	@IsOptional()
	@IsString()
	@MaxLength(50, { message: 'First name cannot exceed 50 characters' })
	@Matches(/^[a-zA-Z\s'-]+$/, { message: 'First name can only contain letters, spaces, apostrophes, and hyphens' })
	firstName?: string;

	@ApiPropertyOptional({
		description: 'Last name',
		example: 'Last',
		maxLength: 50,
	})
	@IsOptional()
	@IsString()
	@MaxLength(50, { message: 'Last name cannot exceed 50 characters' })
	@Matches(/^[a-zA-Z\s'-]+$/, { message: 'Last name can only contain letters, spaces, apostrophes, and hyphens' })
	lastName?: string;

	@ApiPropertyOptional({
		description: 'Avatar URL - must be HTTPS and valid image format',
		example: 'https://example.com/avatar.jpg',
	})
	@IsOptional()
	@IsString()
	@MaxLength(500, { message: 'Avatar URL cannot exceed 500 characters' })
	@IsUrl(
		{
			protocols: ['https'],
			require_protocol: true,
		},
		{ message: 'Avatar URL must be a valid HTTPS URL' }
	)
	@Matches(/\.(jpg|jpeg|png|gif|webp|svg)$/i, {
		message: 'Avatar must be a valid image format (jpg, jpeg, png, gif, webp, svg)',
	})
	avatar?: string;

	@ApiPropertyOptional({
		description: 'User bio',
		example: 'Software developer passionate about trivia',
		maxLength: 500,
	})
	@IsOptional()
	@IsString()
	@MaxLength(500, { message: 'Bio must be less than 500 characters' })
	bio?: string;

	@ApiPropertyOptional({
		description: 'Date of birth',
		example: '1990-01-01',
	})
	@IsOptional()
	@IsDateString({}, { message: 'Date of birth must be a valid date' })
	dateOfBirth?: Date;

	@ApiPropertyOptional({
		description: 'Location',
		example: 'New York, NY',
		maxLength: 100,
	})
	@IsOptional()
	@IsString()
	@MaxLength(100, { message: 'Location cannot exceed 100 characters' })
	location?: string;

	@ApiPropertyOptional({
		description: 'Website URL',
		example: 'https://example.com',
		maxLength: 200,
	})
	@IsOptional()
	@IsString()
	@MaxLength(200, { message: 'Website URL cannot exceed 200 characters' })
	website?: string;

	@ApiPropertyOptional({
		description: 'Social media links',
		example: { twitter: 'https://twitter.com/example', linkedin: 'https://linkedin.com/in/example' },
	})
	@IsOptional()
	@IsObject()
	socialLinks?: Record<string, string>;

	@ApiPropertyOptional({
		description: 'User preferences',
	})
	@IsOptional()
	@ValidateNested()
	@Type(() => Object)
	preferences?: Partial<UserPreferences>;

	@ApiPropertyOptional({
		description: 'User address',
	})
	@IsOptional()
	@ValidateNested()
	@Type(() => Object)
	address?: UserAddress;
}

export class SearchUsersDto {
	@ApiProperty({
		description: 'Search query',
		example: 'john',
		minLength: 1,
		maxLength: 100,
	})
	@IsString()
	@IsNotEmpty({ message: 'Search query is required' })
	@MinLength(1, { message: 'Search query must be at least 1 character long' })
	@MaxLength(100, { message: 'Search query cannot exceed 100 characters' })
	query: string;

	@ApiPropertyOptional({
		description: 'Maximum number of results',
		example: 10,
		minimum: 1,
		maximum: 100,
	})
	@IsOptional()
	@Transform(({ value }) => parseInt(value, 10))
	@IsNumber({}, { message: 'Limit must be a number' })
	@Min(1, { message: 'Limit must be at least 1' })
	@Max(100, { message: 'Limit cannot exceed 100' })
	limit?: number = 10;
}

export class DeductCreditsDto {
	@ApiProperty({
		description: 'Amount of credits to deduct',
		example: 10,
		minimum: 1,
	})
	@IsNumber({}, { message: 'Amount must be a number' })
	@MinLength(1, { message: 'Amount must be greater than 0' })
	amount: number;

	@ApiPropertyOptional({
		description: 'Reason for credit deduction',
		example: 'Game play',
		maxLength: 200,
	})
	@IsOptional()
	@IsString()
	@MaxLength(200, { message: 'Reason cannot exceed 200 characters' })
	reason?: string;
}

export class UpdateUserFieldDto {
	@ApiProperty({
		description: 'Field value to update',
		example: 'New Value',
	})
	@IsNotEmpty({ message: 'Value is required' })
	value: BasicValue;
}

export class UpdateUserPreferencesDto {
	@ApiPropertyOptional({
		description: 'Custom difficulties',
		example: [{ description: 'Custom Difficulty', usageCount: 5, lastUsed: '2024-01-01T00:00:00.000Z' }],
	})
	@IsOptional()
	@IsArray({ message: 'Custom difficulties must be an array' })
	customDifficulties?: CustomDifficultyItem[];

	@ApiPropertyOptional({
		description: 'Sound enabled preference',
		example: true,
	})
	@IsOptional()
	@IsBoolean({ message: 'Sound enabled must be a boolean value' })
	soundEnabled?: boolean;

	@ApiPropertyOptional({
		description: 'Music enabled preference',
		example: true,
	})
	@IsOptional()
	@IsBoolean({ message: 'Music enabled must be a boolean value' })
	musicEnabled?: boolean;

	@ApiPropertyOptional({
		description: 'Animations enabled preference',
		example: true,
	})
	@IsOptional()
	@IsBoolean({ message: 'Animations enabled must be a boolean value' })
	animationsEnabled?: boolean;
}

export class UpdateSinglePreferenceDto {
	@ApiProperty({
		description: 'Preference value',
	})
	@IsNotEmpty({ message: 'Value is required' })
	value: BasicValue;
}

export class UpdateUserCreditsDto {
	@ApiProperty({
		description: 'Amount of credits to update',
		example: 100,
	})
	@IsNumber({}, { message: 'Amount must be a number' })
	@MinLength(1, { message: 'Amount must be greater than 0' })
	amount: number;

	@ApiProperty({
		description: 'Reason for credit update',
		example: 'Admin adjustment',
		maxLength: 200,
	})
	@IsString()
	@IsNotEmpty({ message: 'Reason is required' })
	@MaxLength(200, { message: 'Reason cannot exceed 200 characters' })
	reason: string;
}

export class UpdateUserStatusDto {
	@ApiProperty({
		description: 'User status',
		example: 'active',
		enum: ['active', 'suspended', 'banned'],
	})
	@IsIn(Object.values(UserStatus), { message: 'Status must be a valid user status' })
	status: UserStatus;
}

export class ChangePasswordDto {
	@ApiProperty({ description: 'Current password', minLength: 6, maxLength: 200 })
	@IsString()
	@MinLength(6, { message: 'Current password must be at least 6 characters long' })
	@MaxLength(200, { message: 'Current password cannot exceed 200 characters' })
	currentPassword!: string;

	@ApiProperty({ description: 'New password', minLength: 8, maxLength: 200 })
	@IsString()
	@MinLength(8, { message: 'New password must be at least 8 characters long' })
	@MaxLength(200, { message: 'New password cannot exceed 200 characters' })
	newPassword!: string;
}
