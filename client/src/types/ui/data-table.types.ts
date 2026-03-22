import type { ReactElement } from 'react';

import type { SortDirection, VariantBase } from '@/constants';
import type { PaginationButtonsProps } from './components.types';

export enum DataTableColumnType {
	TEXT = 'text',
	TEXT_PRIMARY = 'text-primary',
	DATE = 'date',
	DATE_OPTIONAL = 'date-optional',
	BADGE = 'badge',
	BADGE_DIFFICULTY = 'badge-difficulty',
	BADGE_ROLE = 'badge-role',
	TRUNCATE = 'truncate',
	CUSTOM = 'custom',
}

export interface DataTableColumn<T> {
	id: string;
	headerLabel?: string;
	emptyHeader?: boolean;
	headerClassName?: string;
	cellClassName?: string;
	type: DataTableColumnType;
	getValue?: (row: T) => unknown;
	format?: (value: unknown, row: T) => string;
	getBadgeVariant?: (row: T) => VariantBase;
	roleBadgeClasses?: Record<string, string>;
	render?: (row: T) => ReactElement | string | number | null;
	truncateTitle?: (row: T) => string;
	dateDefaultValue?: string;
	sortField?: string;
	headerIcon?: ReactElement | null;
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
	/** When set with `renderExpandedRow`, an extra row opens under the matching row (Radix Collapsible). */
	expandedRowId?: string | null;
	renderExpandedRow?: (row: T) => ReactElement | null;
}

export interface DataTableCardHeaderProps {
	title: ReactElement | string;
	description?: ReactElement | string | null;
	toolbar?: ReactElement | string | null;
	pagination: PaginationButtonsProps | null;
	actions?: ReactElement | string | null;
}

export interface DataTableCardProps<T> extends DataTableProps<T> {
	header: DataTableCardHeaderProps;
	filters?: ReactElement | string | null;
	useCard?: boolean;
	/** When true, table/filters render without the card title row (e.g. title lives in a parent Accordion). */
	hideHeader?: boolean;
}
