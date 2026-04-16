import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

import { VALIDATORS } from '@shared/validation';

import { SQL_CONDITIONS, WildcardPattern } from '@internal/constants';

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
			if (value != null) {
				if (key === 'userId' && VALIDATORS.string(value)) {
					queryBuilder.andWhere(`${alias}.${key} = :${key}`, { [key]: value });
				} else if (key === 'topics' && Array.isArray(value)) {
					queryBuilder.andWhere(`${alias}.${groupByField} IN (:...topics)`, {
						topics: value,
					});
				} else if (value === SQL_CONDITIONS.IS_NOT_NULL) {
					queryBuilder.andWhere(`${alias}.${key} ${SQL_CONDITIONS.IS_NOT_NULL}`);
				} else {
					queryBuilder.andWhere(`${alias}.${key} = :${key}`, { [key]: value });
				}
			}
		});
	}

	return queryBuilder;
}

const SEARCH_PATTERN_BUILDERS: Record<WildcardPattern, (term: string) => string> = {
	[WildcardPattern.BOTH]: t => `%${t}%`,
	[WildcardPattern.START]: t => `${t}%`,
	[WildcardPattern.END]: t => `%${t}`,
	[WildcardPattern.NONE]: t => t,
};

export function addSearchConditions<T extends ObjectLiteral>(
	queryBuilder: SelectQueryBuilder<T>,
	alias: string,
	searchFields: string[],
	searchTerm: string,
	options: {
		normalizeTerm?: (term: string) => string;
		wildcardPattern: WildcardPattern;
	}
): SelectQueryBuilder<T> {
	const normalizedTerm = options.normalizeTerm ? options.normalizeTerm(searchTerm) : searchTerm.trim().toLowerCase();

	if (!normalizedTerm || searchFields.length === 0) {
		return queryBuilder;
	}

	const pattern = SEARCH_PATTERN_BUILDERS[options.wildcardPattern](normalizedTerm);

	const conditions = searchFields.map(field => `${alias}.${field} ILIKE :searchTerm`).join(' OR ');

	queryBuilder.andWhere(`(${conditions})`, { searchTerm: pattern });

	return queryBuilder;
}
