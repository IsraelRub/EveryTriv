import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

import { VALIDATION_COUNT } from '@shared/constants';
import { parseQueryIntWithDefault } from '@shared/utils';

export class AdminUsersListQueryDto {
	@ApiPropertyOptional({
		description: 'Page size',
		minimum: VALIDATION_COUNT.ADMIN_USERS_LIST.LIMIT_MIN,
		maximum: VALIDATION_COUNT.ADMIN_USERS_LIST.LIMIT_MAX,
		default: VALIDATION_COUNT.ADMIN_USERS_LIST.DEFAULT_LIMIT,
	})
	@IsOptional()
	@Transform(({ value }) => parseQueryIntWithDefault(value, VALIDATION_COUNT.ADMIN_USERS_LIST.DEFAULT_LIMIT))
	@Type(() => Number)
	@IsInt()
	@Min(VALIDATION_COUNT.ADMIN_USERS_LIST.LIMIT_MIN)
	@Max(VALIDATION_COUNT.ADMIN_USERS_LIST.LIMIT_MAX)
	limit!: number;

	@ApiPropertyOptional({
		description: 'Pagination offset',
		minimum: VALIDATION_COUNT.LIST_QUERY.OFFSET_MIN,
		default: VALIDATION_COUNT.ADMIN_USERS_LIST.DEFAULT_OFFSET,
	})
	@IsOptional()
	@Transform(({ value }) => parseQueryIntWithDefault(value, VALIDATION_COUNT.ADMIN_USERS_LIST.DEFAULT_OFFSET))
	@Type(() => Number)
	@IsInt()
	@Min(VALIDATION_COUNT.LIST_QUERY.OFFSET_MIN)
	@Max(VALIDATION_COUNT.LIST_QUERY.LIMIT_MAX)
	offset!: number;
}
