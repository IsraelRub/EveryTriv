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
	startDate?: Date,
	endDate?: Date
): SelectQueryBuilder<T> {
	if (startDate) {
		queryBuilder.andWhere(`${alias}.${dateField} >= :startDate`, { startDate });
	}

	if (endDate) {
		queryBuilder.andWhere(`${alias}.${dateField} <= :endDate`, { endDate });
	}

	return queryBuilder;
}
