import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

/**
 * Helper function to add ILIKE search conditions to a query builder
 * @param queryBuilder The query builder to add conditions to
 * @param alias The table alias
 * @param searchFields Array of field names to search in
 * @param searchTerm The search term
 * @param options Additional options
 * @returns The query builder with search conditions
 */
export function addSearchConditions<T extends ObjectLiteral>(
	queryBuilder: SelectQueryBuilder<T>,
	alias: string,
	searchFields: string[],
	searchTerm: string,
	options?: {
		normalizeTerm?: (term: string) => string;
		wildcardPattern?: 'both' | 'start' | 'end' | 'none';
	}
): SelectQueryBuilder<T> {
	const normalizedTerm = options?.normalizeTerm ? options.normalizeTerm(searchTerm) : searchTerm.trim().toLowerCase();

	if (!normalizedTerm || searchFields.length === 0) {
		return queryBuilder;
	}

	const pattern = (() => {
		switch (options?.wildcardPattern) {
			case 'both':
				return `%${normalizedTerm}%`;
			case 'start':
				return `${normalizedTerm}%`;
			case 'end':
				return `%${normalizedTerm}`;
			case 'none':
				return normalizedTerm;
			default:
				return `%${normalizedTerm}%`;
		}
	})();

	const conditions = searchFields.map(field => `${alias}.${field} ILIKE :searchTerm`).join(' OR ');

	queryBuilder.andWhere(`(${conditions})`, { searchTerm: pattern });

	return queryBuilder;
}
