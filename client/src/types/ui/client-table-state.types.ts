import type { SortDirection } from '@/constants';
import type { UsePaginationReturn } from '../core';

export interface UseClientTableStateOptions<T> {
	data: T[];
	filterFn?: (item: T) => boolean;
	sortFields: ReadonlySet<string>;
	compare: (a: T, b: T, sortBy: string) => number;
	initialSortBy: string;
	initialSortDirection?: SortDirection;
	itemsPerPage?: number;
}

export interface UseClientTableStateReturn<T> {
	paginatedData: T[];
	sortedData: T[];
	totalFiltered: number;
	sortBy: string;
	sortDirection: SortDirection;
	onSort: (field: string, direction: SortDirection) => void;
	pagination: UsePaginationReturn;
}
