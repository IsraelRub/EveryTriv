import type { ReactNode } from 'react';

import type { SortDirection, VariantBase } from '@/constants';
import type { PaginationButtonsProps } from './components.types';

export type { SortDirection } from '@/constants';

export type DataTableColumnType =
	| 'text'
	| 'text-primary'
	| 'date'
	| 'date-optional'
	| 'badge'
	| 'badge-difficulty'
	| 'badge-role'
	| 'truncate'
	| 'custom';

export interface DataTableColumn<T> {
	id: string;
	emptyHeader?: boolean;
	headerClassName?: string;
	cellClassName?: string;
	type: DataTableColumnType;
	getValue?: (row: T) => unknown;
	format?: (value: unknown, row: T) => string;
	getBadgeVariant?: (row: T) => VariantBase;
	roleBadgeClasses?: Record<string, string>;
	render?: (row: T) => ReactNode;
	truncateTitle?: (row: T) => string;
	dateDefaultValue?: string;
	sortField?: string;
	headerIcon?: ReactNode;
}

export interface DataTableProps<T> {
	columns: DataTableColumn<T>[];
	data: T[];
	getRowKey: (row: T) => string;
	isLoading?: boolean;
	emptyState?: {
		title: string;
		description: string;
	};
	emptyValue?: string;
	sortBy?: string;
	sortDirection?: SortDirection;
	onSort?: (field: string, direction: SortDirection) => void;
}

export interface DataTableCardHeaderProps {
	title: ReactNode;
	description?: ReactNode;
	toolbar?: ReactNode;
	pagination: PaginationButtonsProps | null;
	actions?: ReactNode;
}

export interface DataTableCardProps<T> extends DataTableProps<T> {
	header: DataTableCardHeaderProps;
	filters?: ReactNode;
	useCard?: boolean;
}
