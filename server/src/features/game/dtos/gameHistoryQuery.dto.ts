import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class GameHistoryQueryDto {
	@ApiPropertyOptional({
		description: 'Maximum number of entries to return',
		minimum: 1,
		maximum: 1000,
		default: 20,
	})
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(1000)
	limit?: number;

	@ApiPropertyOptional({
		description: 'Pagination offset',
		minimum: 0,
		default: 0,
	})
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(0)
	offset?: number;
}
