import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
	IsArray,
	IsBoolean,
	IsEnum,
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

import {
	DifficultyLevel,
	ERROR_MESSAGES,
	GameMode,
	Locale,
	UserStatus,
	VALIDATION_COUNT,
	VALIDATION_LENGTH,
} from '@shared/constants';
import type { BasicValue, CustomDifficultyItem, UserPreferences } from '@shared/types';
import { nullIfBlankString, parseQueryIntDefaultWhenMissing } from '@shared/utils';

export class UpdateUserProfileDto {
	@ApiPropertyOptional({
		description: 'First name',
		maxLength: VALIDATION_LENGTH.NAME.MAX,
	})
	@IsOptional()
	@IsString()
	@MaxLength(VALIDATION_LENGTH.NAME.MAX, {
		message: `First name cannot exceed ${VALIDATION_LENGTH.NAME.MAX} characters`,
	})
	@Matches(/^[\p{L}\s'-]+$/u, {
		message: 'First name can only contain letters, spaces, apostrophes, and hyphens',
	})
	firstName?: string;

	@ApiPropertyOptional({
		description: 'Last name (empty string to clear)',
		maxLength: VALIDATION_LENGTH.NAME.MAX,
	})
	@IsOptional()
	@Transform(({ value }) => nullIfBlankString(value))
	@ValidateIf(o => o.lastName !== null)
	@IsString()
	@ValidateIf(o => o.lastName !== null)
	@MaxLength(VALIDATION_LENGTH.NAME.MAX, {
		message: `Last name cannot exceed ${VALIDATION_LENGTH.NAME.MAX} characters`,
	})
	@ValidateIf(o => o.lastName !== null)
	@Matches(/^[\p{L}\s'-]+$/u, {
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
		minLength: VALIDATION_LENGTH.SEARCH_QUERY.MIN,
		maxLength: VALIDATION_LENGTH.SEARCH_QUERY.MAX,
	})
	@IsString()
	@IsNotEmpty({ message: 'Search query is required' })
	@MinLength(VALIDATION_LENGTH.SEARCH_QUERY.MIN, {
		message: `Search query must be at least ${VALIDATION_LENGTH.SEARCH_QUERY.MIN} character long`,
	})
	@MaxLength(VALIDATION_LENGTH.SEARCH_QUERY.MAX, {
		message: `Search query cannot exceed ${VALIDATION_LENGTH.SEARCH_QUERY.MAX} characters`,
	})
	query: string;

	@ApiPropertyOptional({
		description: 'Maximum number of results',
		minimum: VALIDATION_COUNT.LEADERBOARD.MIN,
		maximum: VALIDATION_COUNT.LEADERBOARD.MAX,
		default: 10,
	})
	@Transform(({ value }) => parseQueryIntDefaultWhenMissing(value, VALIDATION_COUNT.LIST_QUERY.DEFAULT_PAGE_SIZE))
	@IsNumber({}, { message: 'Limit must be a number' })
	@Min(VALIDATION_COUNT.LEADERBOARD.MIN, {
		message: `Limit must be at least ${VALIDATION_COUNT.LEADERBOARD.MIN}`,
	})
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

export class UpdateUserGamePreferencesDto {
	@ApiPropertyOptional({ description: 'Default difficulty', enum: DifficultyLevel })
	@IsOptional()
	@IsEnum(DifficultyLevel)
	defaultDifficulty?: DifficultyLevel;

	@ApiPropertyOptional({
		description: 'Required when defaultDifficulty is custom — plain-text description (same length rules as gameplay).',
	})
	@ValidateIf(o => o.defaultDifficulty !== DifficultyLevel.CUSTOM)
	@IsOptional()
	@ValidateIf(o => o.defaultDifficulty === DifficultyLevel.CUSTOM)
	@IsString()
	@IsNotEmpty({ message: ERROR_MESSAGES.validation.CUSTOM_DIFFICULTY_REQUIRES_DESCRIPTION })
	@MinLength(VALIDATION_LENGTH.CUSTOM_DIFFICULTY.MIN, {
		message: `Custom difficulty description must be at least ${VALIDATION_LENGTH.CUSTOM_DIFFICULTY.MIN} characters`,
	})
	@MaxLength(VALIDATION_LENGTH.CUSTOM_DIFFICULTY.MAX, {
		message: `Custom difficulty description cannot exceed ${VALIDATION_LENGTH.CUSTOM_DIFFICULTY.MAX} characters`,
	})
	defaultCustomDifficultyDescription?: string;

	@ApiPropertyOptional({ description: 'Default topic' })
	@IsOptional()
	@IsString()
	defaultTopic?: string;

	@ApiPropertyOptional({ description: 'Default game mode', enum: GameMode })
	@IsOptional()
	@IsEnum(GameMode)
	defaultGameMode?: GameMode;

	@ApiPropertyOptional({ description: 'Time limit in seconds' })
	@IsOptional()
	@IsNumber()
	timeLimit?: number;

	@ApiPropertyOptional({ description: 'Max questions per game' })
	@IsOptional()
	@IsNumber()
	maxQuestionsPerGame?: number;
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

	@ApiPropertyOptional({
		description: 'UI locale (synced across devices)',
		enum: Locale,
	})
	@IsOptional()
	@IsEnum(Locale)
	locale?: Locale;

	@ApiPropertyOptional({
		description: 'Last game settings (synced across devices)',
		type: UpdateUserGamePreferencesDto,
	})
	@IsOptional()
	@ValidateNested()
	@Type(() => UpdateUserGamePreferencesDto)
	game?: UpdateUserGamePreferencesDto;
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
		minimum: VALIDATION_COUNT.CREDITS.MIN,
		maximum: VALIDATION_COUNT.CREDITS.MAX,
	})
	@IsNumber({}, { message: 'Amount must be a number' })
	@Min(VALIDATION_COUNT.CREDITS.MIN, {
		message: `Amount must be at least ${VALIDATION_COUNT.CREDITS.MIN}`,
	})
	@Max(VALIDATION_COUNT.CREDITS.MAX, {
		message: `Amount cannot exceed ${VALIDATION_COUNT.CREDITS.MAX}`,
	})
	amount: number;

	@ApiProperty({
		description: 'Reason for credit update',
		example: 'Admin adjustment',
		maxLength: VALIDATION_LENGTH.REASON.MAX,
	})
	@IsString()
	@IsNotEmpty({ message: 'Reason is required' })
	@MaxLength(VALIDATION_LENGTH.REASON.MAX, {
		message: `Reason cannot exceed ${VALIDATION_LENGTH.REASON.MAX} characters`,
	})
	reason: string;
}

export class UpdateUserStatusDto {
	@ApiProperty({
		description: 'User status',
		enum: UserStatus,
	})
	@IsEnum(UserStatus, { message: 'Status must be a valid user status' })
	status!: UserStatus;
}

export class ChangePasswordDto {
	@ApiProperty({
		description: 'Current password',
		minLength: VALIDATION_LENGTH.PASSWORD.MIN,
		maxLength: VALIDATION_LENGTH.PASSWORD.MAX,
	})
	@IsString()
	@MinLength(VALIDATION_LENGTH.PASSWORD.MIN, {
		message: `Current password must be at least ${VALIDATION_LENGTH.PASSWORD.MIN} characters long`,
	})
	@MaxLength(VALIDATION_LENGTH.PASSWORD.MAX, {
		message: `Current password cannot exceed ${VALIDATION_LENGTH.PASSWORD.MAX} characters`,
	})
	currentPassword!: string;

	@ApiProperty({
		description: 'New password',
		minLength: VALIDATION_LENGTH.PASSWORD.MIN,
		maxLength: VALIDATION_LENGTH.PASSWORD.MAX,
	})
	@IsString()
	@MinLength(VALIDATION_LENGTH.PASSWORD.MIN, {
		message: `New password must be at least ${VALIDATION_LENGTH.PASSWORD.MIN} characters long`,
	})
	@MaxLength(VALIDATION_LENGTH.PASSWORD.MAX, {
		message: `New password cannot exceed ${VALIDATION_LENGTH.PASSWORD.MAX} characters`,
	})
	newPassword!: string;
}

export class SetAvatarDto {
	@ApiProperty({
		description: `Avatar ID: ${VALIDATION_COUNT.AVATAR_ID.CLEAR} to clear avatar, ${VALIDATION_COUNT.AVATAR_ID.MIN}-${VALIDATION_COUNT.AVATAR_ID.MAX} to set`,
		minimum: VALIDATION_COUNT.AVATAR_ID.CLEAR,
		maximum: VALIDATION_COUNT.AVATAR_ID.MAX,
	})
	@IsNumber({}, { message: 'Avatar ID must be a number' })
	@IsNotEmpty({ message: 'Avatar ID is required' })
	@Min(VALIDATION_COUNT.AVATAR_ID.CLEAR, {
		message: `Avatar ID must be ${VALIDATION_COUNT.AVATAR_ID.CLEAR} (clear) or between ${VALIDATION_COUNT.AVATAR_ID.MIN} and ${VALIDATION_COUNT.AVATAR_ID.MAX}`,
	})
	@Max(VALIDATION_COUNT.AVATAR_ID.MAX, {
		message: `Avatar ID cannot exceed ${VALIDATION_COUNT.AVATAR_ID.MAX}`,
	})
	avatarId!: number;
}
