export interface TablePaginationProps {
	totalPages: number;
	totalItems: number;
	startIndex: number;
	endIndex: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
	onNextPage: () => void;
	onPreviousPage: () => void;
	isLoading?: boolean;
	itemsLabel?: string;
}
