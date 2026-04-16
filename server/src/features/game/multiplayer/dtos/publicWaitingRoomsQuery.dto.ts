import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

import { Locale, VALIDATION_COUNT, VALIDATION_LENGTH } from '@shared/constants';
import { parseQueryIntWithDefault } from '@shared/utils';

export class PublicWaitingRoomsQueryDto {
	@ApiPropertyOptional({
		name: 'q',
		description: 'Case-insensitive substring filter on room topic',
		maxLength: VALIDATION_LENGTH.TOPIC.MAX,
	})
	@IsOptional()
	@IsString()
	@MaxLength(VALIDATION_LENGTH.TOPIC.MAX)
	q?: string;

	@ApiPropertyOptional({
		description: `Max rooms to return (${VALIDATION_COUNT.MULTIPLAYER_PUBLIC_LOBBY_LIST.LIMIT_MIN}-${VALIDATION_COUNT.MULTIPLAYER_PUBLIC_LOBBY_LIST.LIMIT_MAX}, default ${VALIDATION_COUNT.MULTIPLAYER_PUBLIC_LOBBY_LIST.LIMIT})`,
		minimum: VALIDATION_COUNT.MULTIPLAYER_PUBLIC_LOBBY_LIST.LIMIT_MIN,
		maximum: VALIDATION_COUNT.MULTIPLAYER_PUBLIC_LOBBY_LIST.LIMIT_MAX,
		default: VALIDATION_COUNT.MULTIPLAYER_PUBLIC_LOBBY_LIST.LIMIT,
	})
	@IsOptional()
	@Transform(({ value }) => parseQueryIntWithDefault(value, VALIDATION_COUNT.MULTIPLAYER_PUBLIC_LOBBY_LIST.LIMIT))
	@Type(() => Number)
	@IsInt()
	@Min(VALIDATION_COUNT.MULTIPLAYER_PUBLIC_LOBBY_LIST.LIMIT_MIN)
	@Max(VALIDATION_COUNT.MULTIPLAYER_PUBLIC_LOBBY_LIST.LIMIT_MAX)
	limit!: number;

	@ApiPropertyOptional({
		name: 'lang',
		description: 'Room trivia output language (en|he)',
		enum: Locale,
	})
	@IsOptional()
	@IsEnum(Locale, { message: 'lang must be a supported locale (en or he)' })
	lang?: Locale;
}
