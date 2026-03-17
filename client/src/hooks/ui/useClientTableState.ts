import { useCallback, useMemo, useState } from 'react';

import { DEFAULT_ITEMS_PER_PAGE, SortDirection } from '@/constants';
import type { UseClientTableStateOptions, UseClientTableStateReturn } from '@/types';
import { usePagination } from '@/hooks/ui/usePagination';

export function useClientTableState<T>({
	data,
	filterFn,
	sortFields,
	compare,
	initialSortBy,
	initialSortDirection = SortDirection.DESC,
	itemsPerPage = DEFAULT_ITEMS_PER_PAGE,
}: UseClientTableStateOptions<T>): UseClientTableStateReturn<T> {
	const [sortBy, setSortBy] = useState(initialSortBy);
	const [sortDirection, setSortDirection] = useState<SortDirection>(initialSortDirection);

	const filteredData = useMemo(() => (filterFn ? data.filter(filterFn) : data), [data, filterFn]);

	const totalFiltered = filteredData.length;

	const pagination = usePagination({
		itemsPerPage,
		totalItems: totalFiltered,
		initialPage: 1,
	});

	const sortedData = useMemo(() => {
		return [...filteredData].sort((a, b) => {
			const comparison = compare(a, b, sortBy);
			return sortDirection === SortDirection.ASC ? comparison : -comparison;
		});
	}, [filteredData, sortBy, sortDirection, compare]);

	const paginatedData = useMemo(
		() => sortedData.slice(pagination.startIndex, pagination.endIndex),
		[sortedData, pagination.startIndex, pagination.endIndex]
	);

	const onSort = useCallback(
		(field: string, direction: SortDirection) => {
			if (!sortFields.has(field)) return;
			setSortBy(field);
			setSortDirection(direction);
			pagination.goToFirstPage();
		},
		[sortFields, pagination]
	);

	return {
		paginatedData,
		sortedData,
		totalFiltered,
		sortBy,
		sortDirection,
		onSort,
		pagination,
	};
}
