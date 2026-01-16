export function calculateCurrentPage(offset: number, limit: number): number {
	if (limit <= 0) {
		return 1;
	}
	return Math.floor(offset / limit) + 1;
}

export function calculateTotalPages(total: number, limit: number): number {
	if (limit <= 0 || total <= 0) {
		return 0;
	}
	return Math.ceil(total / limit);
}

export function calculateHasMore(offset: number, currentCount: number, total: number): boolean {
	return offset + currentCount < total;
}

export function calculateHasNext(page: number, totalPages: number): boolean {
	return page < totalPages;
}

export function calculateHasPrev(page: number): boolean {
	return page > 1;
}
