export interface UsePaginationOptions {
	itemsPerPage?: number;
	totalItems: number;
	initialPage?: number;
	onPageChange?: (page: number) => void;
}

export interface UsePaginationReturn extends PaginationDisplayState {
	currentPage: number;
	itemsPerPage: number;
	totalItems: number;
	goToPage: (page: number) => void;
	goToNextPage: () => void;
	goToPreviousPage: () => void;
	goToFirstPage: () => void;
	goToLastPage: () => void;
}
export interface PaginationDisplayState {
	totalPages: number;
	startIndex: number;
	endIndex: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
}
