import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

import { VALIDATION_COUNT } from '@shared/constants';

export class GameHistoryQueryDto {
	@ApiPropertyOptional({
		description: 'Maximum number of entries to return',
		minimum: VALIDATION_COUNT.LIST_QUERY.LIMIT_MIN,
		maximum: VALIDATION_COUNT.LIST_QUERY.LIMIT_MAX,
		default: 50,
	})
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(VALIDATION_COUNT.LIST_QUERY.LIMIT_MIN)
	@Max(VALIDATION_COUNT.LIST_QUERY.LIMIT_MAX)
	limit?: number;

	@ApiPropertyOptional({
		description: 'Pagination offset',
		minimum: VALIDATION_COUNT.LIST_QUERY.OFFSET_MIN,
		default: 0,
	})
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(VALIDATION_COUNT.LIST_QUERY.OFFSET_MIN)
	offset?: number;
}
