import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

/**
 * Helper function to add date range conditions to a query builder
 * @param queryBuilder The query builder to add conditions to
 * @param alias The table alias
 * @param dateField The field name for the date (default: 'createdAt')
 * @param startDate Optional start date
 * @param endDate Optional end date
 * @returns The query builder with date range conditions
 */
export function addDateRangeConditions<T extends ObjectLiteral>(
	queryBuilder: SelectQueryBuilder<T>,
	alias: string,
	dateField: string = 'createdAt',
	startDate?: Date | string,
	endDate?: Date | string
): SelectQueryBuilder<T> {
	if (startDate) {
		const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
		queryBuilder.andWhere(`${alias}.${dateField} >= :startDate`, { startDate: start });
	}

	if (endDate) {
		const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
		queryBuilder.andWhere(`${alias}.${dateField} <= :endDate`, { endDate: end });
	}

	return queryBuilder;
}
