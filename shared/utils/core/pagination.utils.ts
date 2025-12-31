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

/**
 * Calculate if there are more items after current set
 * @param offset Current offset (starting position)
 * @param currentCount Number of items in current set
 * @param total Total number of items
 * @returns Whether there are more items after current set
 * @example calculateHasMore(0, 10, 25) => true
 * @example calculateHasMore(20, 5, 25) => false
 */
export function calculateHasMore(offset: number, currentCount: number, total: number): boolean {
	return offset + currentCount < total;
}

/**
 * Calculate if there is a next page
 * @param page Current page number (1-based)
 * @param totalPages Total number of pages
 * @returns Whether there is a next page
 * @example calculateHasNext(1, 5) => true
 * @example calculateHasNext(5, 5) => false
 */
export function calculateHasNext(page: number, totalPages: number): boolean {
	return page < totalPages;
}

/**
 * Calculate if there is a previous page
 * @param page Current page number (1-based)
 * @returns Whether there is a previous page
 * @example calculateHasPrev(2) => true
 * @example calculateHasPrev(1) => false
 */
export function calculateHasPrev(page: number): boolean {
	return page > 1;
}
