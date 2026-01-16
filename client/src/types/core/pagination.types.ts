export interface UsePaginationOptions {
	itemsPerPage?: number;
	totalItems: number;
	initialPage?: number;
	onPageChange?: (page: number) => void;
}

export interface UsePaginationReturn {
	currentPage: number;
	totalPages: number;
	itemsPerPage: number;
	startIndex: number;
	endIndex: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
	goToPage: (page: number) => void;
	goToNextPage: () => void;
	goToPreviousPage: () => void;
	goToFirstPage: () => void;
	goToLastPage: () => void;
}
