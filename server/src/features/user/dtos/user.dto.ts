import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
	IsArray,
	IsBoolean,
	IsIn,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	Matches,
	Max,
	MaxLength,
	Min,
	MinLength,
	ValidateIf,
	ValidateNested,
} from 'class-validator';

import { UserStatus, VALID_USER_STATUSES, VALIDATION_COUNT } from '@shared/constants';
import type { BasicValue, CustomDifficultyItem, UserPreferences } from '@shared/types';

export class UpdateUserProfileDto {
	@ApiPropertyOptional({
		description: 'First name',
		maxLength: 50,
	})
	@IsOptional()
	@IsString()
	@MaxLength(50, { message: 'First name cannot exceed 50 characters' })
	@Matches(/^[a-zA-Z\s'-]+$/, {
		message: 'First name can only contain letters, spaces, apostrophes, and hyphens',
	})
	firstName?: string;

	@ApiPropertyOptional({
		description: 'Last name (empty string to clear)',
		maxLength: 50,
	})
	@IsOptional()
	@Transform(({ value }) => (typeof value === 'string' && value.trim().length === 0 ? null : value))
	@ValidateIf(o => o.lastName !== null)
	@IsString()
	@ValidateIf(o => o.lastName !== null)
	@MaxLength(50, { message: 'Last name cannot exceed 50 characters' })
	@ValidateIf(o => o.lastName !== null)
	@Matches(/^[a-zA-Z\s'-]+$/, {
		message: 'Last name can only contain letters, spaces, apostrophes, and hyphens',
	})
	lastName?: string | null;

	@ApiPropertyOptional({
		description: 'User preferences',
	})
	@IsOptional()
	@ValidateNested()
	@Type(() => Object)
	preferences?: Partial<UserPreferences>;
}

export class SearchUsersDto {
	@ApiProperty({
		description: 'Search query',
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
		minimum: 1,
		maximum: VALIDATION_COUNT.LEADERBOARD.MAX,
		default: 10,
	})
	@Transform(({ value }) => parseInt(value, 10))
	@IsNumber({}, { message: 'Limit must be a number' })
	@Min(1, { message: 'Limit must be at least 1' })
	@Max(VALIDATION_COUNT.LEADERBOARD.MAX, {
		message: `Limit cannot exceed ${VALIDATION_COUNT.LEADERBOARD.MAX}`,
	})
	limit: number = 10;
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
		example: [
			{
				description: 'Custom Difficulty',
				usageCount: 5,
				lastUsed: '2024-01-01T00:00:00.000Z',
			},
		],
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
		minimum: 1,
	})
	@IsNumber({}, { message: 'Amount must be a number' })
	@Min(1, { message: 'Amount must be greater than 0' })
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
		enum: VALID_USER_STATUSES,
	})
	@IsIn(VALID_USER_STATUSES, { message: 'Status must be a valid user status' })
	status: UserStatus;
}

export class ChangePasswordDto {
	@ApiProperty({ description: 'Current password', minLength: 6, maxLength: 15 })
	@IsString()
	@MinLength(6, {
		message: 'Current password must be at least 6 characters long',
	})
	@MaxLength(15, { message: 'Current password cannot exceed 15 characters' })
	currentPassword!: string;

	@ApiProperty({ description: 'New password', minLength: 6, maxLength: 15 })
	@IsString()
	@MinLength(6, { message: 'New password must be at least 6 characters long' })
	@MaxLength(15, { message: 'New password cannot exceed 15 characters' })
	newPassword!: string;
}

export class SetAvatarDto {
	@ApiProperty({
		description: `Avatar ID (${VALIDATION_COUNT.AVATAR_ID.MIN}-${VALIDATION_COUNT.AVATAR_ID.MAX})`,
		minimum: VALIDATION_COUNT.AVATAR_ID.MIN,
		maximum: VALIDATION_COUNT.AVATAR_ID.MAX,
	})
	@IsNumber({}, { message: 'Avatar ID must be a number' })
	@IsNotEmpty({ message: 'Avatar ID is required' })
	@Min(VALIDATION_COUNT.AVATAR_ID.MIN, {
		message: `Avatar ID must be at least ${VALIDATION_COUNT.AVATAR_ID.MIN}`,
	})
	@Max(VALIDATION_COUNT.AVATAR_ID.MAX, {
		message: `Avatar ID cannot exceed ${VALIDATION_COUNT.AVATAR_ID.MAX}`,
	})
	avatarId!: number;
}
