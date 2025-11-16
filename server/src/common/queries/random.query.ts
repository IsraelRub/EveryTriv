import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

/**
 * Creates a random query builder helper with RANDOM() ordering
 * @param repository The repository to create query from
 * @param alias The table alias
 * @param whereConditions Optional where conditions
 * @param limit Optional limit
 * @returns A query builder with RANDOM() ordering
 */
export function createRandomQuery<T extends ObjectLiteral>(
	repository: { createQueryBuilder: (alias: string) => SelectQueryBuilder<T> },
	alias: string,
	whereConditions?: Record<string, unknown>,
	limit?: number
): SelectQueryBuilder<T> {
	const queryBuilder = repository.createQueryBuilder(alias);

	if (whereConditions) {
		Object.entries(whereConditions).forEach(([key, value]) => {
			if (value !== undefined && value !== null) {
				queryBuilder.andWhere(`${alias}.${key} = :${key}`, { [key]: value });
			}
		});
	}

	queryBuilder.orderBy('RANDOM()');

	if (limit !== undefined) {
		queryBuilder.limit(limit);
	}

	return queryBuilder;
}
