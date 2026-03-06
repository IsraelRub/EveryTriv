import { useCallback, useMemo, useState } from 'react';

import { DEFAULT_ITEMS_PER_PAGE } from '@/constants';
import type { UsePaginationOptions, UsePaginationReturn } from '@/types';
import { calculateTotalPages } from '@/utils';

export function usePagination({
	itemsPerPage = DEFAULT_ITEMS_PER_PAGE,
	totalItems,
	initialPage = 1,
	onPageChange,
}: UsePaginationOptions): UsePaginationReturn {
	const [currentPage, setCurrentPage] = useState(initialPage);

	const totalPages = useMemo(() => calculateTotalPages(totalItems, itemsPerPage), [totalItems, itemsPerPage]);

	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;

	const hasNextPage = startIndex + itemsPerPage < totalItems;
	const hasPreviousPage = startIndex > 0;

	const goToPage = useCallback(
		(page: number) => {
			const validPage = Math.max(1, Math.min(page, totalPages));
			setCurrentPage(validPage);
			onPageChange?.(validPage);
		},
		[totalPages, onPageChange]
	);

	const goToNextPage = useCallback(() => {
		if (hasNextPage) {
			goToPage(currentPage + 1);
		}
	}, [hasNextPage, currentPage, goToPage]);

	const goToPreviousPage = useCallback(() => {
		if (hasPreviousPage) {
			goToPage(currentPage - 1);
		}
	}, [hasPreviousPage, currentPage, goToPage]);

	const goToFirstPage = useCallback(() => {
		goToPage(1);
	}, [goToPage]);

	const goToLastPage = useCallback(() => {
		goToPage(totalPages);
	}, [goToPage, totalPages]);

	return {
		currentPage,
		totalPages,
		itemsPerPage,
		totalItems,
		startIndex,
		endIndex,
		hasNextPage,
		hasPreviousPage,
		goToPage,
		goToNextPage,
		goToPreviousPage,
		goToFirstPage,
		goToLastPage,
	};
}
