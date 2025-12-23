/**
 * Pagination Utilities
 *
 * @module PaginationUtils
 * @description Utility functions for pagination calculations shared between client and server
 * @used_by client/src/components, server/src/features
 */

/**
 * Calculate current page number from offset
 * @param offset Current offset (starting position)
 * @param limit Items per page
 * @returns Current page number (1-based)
 * @description Uses Math.floor because offset is always a multiple of limit
 * @example calculateCurrentPage(50, 25) => 3
 */
export function calculateCurrentPage(offset: number, limit: number): number {
	if (limit <= 0) {
		return 1;
	}
	return Math.floor(offset / limit) + 1;
}

/**
 * Calculate total number of pages
 * @param total Total number of items
 * @param limit Items per page
 * @returns Total number of pages
 * @description Uses Math.ceil to include the last page even if not full
 * @example calculateTotalPages(101, 50) => 3
 */
export function calculateTotalPages(total: number, limit: number): number {
	if (limit <= 0 || total <= 0) {
		return 0;
	}
	return Math.ceil(total / limit);
}
