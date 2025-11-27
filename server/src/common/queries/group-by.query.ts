import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

/**
 * Creates a GROUP BY query with COUNT aggregation at the database level.
 *
 * @description Intended for DB-level aggregations and COUNT queries on large datasets.
 * For in-memory grouping on arrays that are already loaded, prefer the groupBy utility
 * from shared core data utilities.
 *
 * @param repository The repository to create query from
 * @param alias The table alias
 * @param groupByField The field to group by
 * @param countFieldAlias The alias for the count field (default: 'count')
 * @param whereConditions Optional where conditions
 * @returns A query builder with GROUP BY and COUNT
 */
export function createGroupByQuery<T extends ObjectLiteral>(
	repository: { createQueryBuilder: (alias: string) => SelectQueryBuilder<T> },
	alias: string,
	groupByField: string,
	countFieldAlias: string = 'count',
	whereConditions?: Record<string, unknown>
): SelectQueryBuilder<T> {
	const queryBuilder = repository.createQueryBuilder(alias);

	queryBuilder
		.select(`${alias}.${groupByField}`, groupByField)
		.addSelect(`CAST(COUNT(*) AS INTEGER)`, countFieldAlias)
		.groupBy(`${alias}.${groupByField}`);

	if (whereConditions) {
		Object.entries(whereConditions).forEach(([key, value]) => {
			if (value !== undefined && value !== null) {
				if (key === 'userId' && typeof value === 'string') {
					queryBuilder.andWhere(`${alias}.${key} = :${key}`, { [key]: value });
				} else if (key === 'topics' && Array.isArray(value)) {
					queryBuilder.andWhere(`${alias}.${groupByField} IN (:...topics)`, { topics: value });
				} else if (value === 'IS NOT NULL') {
					queryBuilder.andWhere(`${alias}.${key} IS NOT NULL`);
				} else {
					queryBuilder.andWhere(`${alias}.${key} = :${key}`, { [key]: value });
				}
			}
		});
	}

	return queryBuilder;
}
