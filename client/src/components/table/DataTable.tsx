import { cloneElement, isValidElement, memo, type ReactNode } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';

import { EMPTY_VALUE } from '@shared/constants';
import { formatDate, formatDifficulty, formatTitle, getDifficultyBadgeClasses } from '@shared/utils';
import { VALIDATORS } from '@shared/validation';

import { SKELETON_PLACEHOLDER_COUNTS, SkeletonVariant, SortDirection, VariantBase } from '@/constants';
import {
	Badge,
	EmptyState,
	Skeleton,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components';
import type { DataTableColumn, DataTableProps } from '@/types';
import { cn } from '@/utils';

/** Single source of truth for data table cell and header icon styling (this file only). */
const EMPTY_CELL_CLASS = 'text-muted-foreground';
const HEADER_ICON_CLASS = 'h-4 w-4';

function withHeaderIconClass(node: ReactNode): ReactNode {
	if (!isValidElement(node)) return node;
	const props = node.props;
	const existingClass = 'className' in props && VALIDATORS.string(props.className) ? props.className : undefined;
	return cloneElement(node, {
		className: cn(HEADER_ICON_CLASS, existingClass),
	});
}

function renderCell<T>(column: DataTableColumn<T>, row: T, emptyValue: string): ReactNode {
	const type = column.type;
	const value = column.getValue?.(row);
	const formatted = column.format
		? column.format(value, row)
		: type === 'badge-difficulty'
			? formatDifficulty(String(value ?? ''))
			: String(value ?? '');
	const isEmpty = value == null || value === '' || formatted === emptyValue;

	switch (type) {
		case 'custom':
			return column.render?.(row) ?? null;

		case 'text':
		case 'text-primary':
			if (isEmpty) return <span className={EMPTY_CELL_CLASS}>{emptyValue}</span>;
			return formatted;

		case 'date': {
			const dateValue = value == null || VALIDATORS.string(value) || value instanceof Date ? value : undefined;
			return formatDate(dateValue, emptyValue);
		}

		case 'date-optional': {
			const dateDefault = column.dateDefaultValue ?? emptyValue;
			if (isEmpty) return <span className={EMPTY_CELL_CLASS}>{dateDefault}</span>;
			const dateValue = value == null || VALIDATORS.string(value) || value instanceof Date ? value : undefined;
			return formatDate(dateValue, dateDefault);
		}

		case 'badge':
			if (isEmpty) return <span className={EMPTY_CELL_CLASS}>{emptyValue}</span>;
			return (
				<Badge variant={column.getBadgeVariant?.(row) ?? VariantBase.OUTLINE} className='shrink-0'>
					{formatted}
				</Badge>
			);

		case 'badge-difficulty': {
			if (isEmpty) return <span className={EMPTY_CELL_CLASS}>{emptyValue}</span>;
			return (
				<Badge variant={VariantBase.OUTLINE} className={cn('shrink-0', getDifficultyBadgeClasses(value))}>
					{formatted}
				</Badge>
			);
		}

		case 'badge-role': {
			if (isEmpty) return <span className={EMPTY_CELL_CLASS}>{emptyValue}</span>;
			const roleKey = String(value ?? '').toLowerCase();
			const badgeClasses = column.roleBadgeClasses?.[roleKey] ?? 'border-muted text-muted-foreground';
			return (
				<Badge variant={VariantBase.OUTLINE} className={cn('shrink-0', badgeClasses)}>
					{formatted}
				</Badge>
			);
		}

		case 'truncate': {
			const title = column.truncateTitle?.(row) ?? formatted;
			return (
				<div className='truncate' title={title}>
					{formatted}
				</div>
			);
		}

		default: {
			if (isEmpty) return <span className={EMPTY_CELL_CLASS}>{emptyValue}</span>;
			return formatted;
		}
	}
}

function getCellClassName<T>(column: DataTableColumn<T>): string | undefined {
	switch (column.type) {
		case 'text-primary':
			return 'font-medium';
		case 'date':
		case 'date-optional':
			return 'text-sm text-muted-foreground whitespace-nowrap';
		case 'truncate':
			return 'max-w-md';
		default:
			return column.cellClassName ?? undefined;
	}
}

function renderHeader<T>(
	col: DataTableColumn<T>,
	sortBy: string | undefined,
	sortDirection: SortDirection | undefined,
	onSort: ((field: string, direction: SortDirection) => void) | undefined
): ReactNode {
	const isSortable = !!(col.sortField && onSort);
	const isActive = sortBy === col.sortField;
	const label = col.emptyHeader ? '' : formatTitle(col.id);

	if (!isSortable) {
		return (
			<span className='flex items-center gap-2 w-full text-left'>
				{col.headerIcon != null ? withHeaderIconClass(col.headerIcon) : null}
				{label}
			</span>
		);
	}

	const nextDirection: SortDirection =
		isActive && sortDirection === SortDirection.ASC ? SortDirection.DESC : SortDirection.ASC;
	const sortField = col.sortField;
	const handleClick = () => {
		if (sortField != null) onSort(sortField, nextDirection);
	};

	return (
		<button
			type='button'
			onClick={handleClick}
			className={cn(
				'flex items-center gap-2 hover:text-primary transition-colors text-left font-inherit',
				isActive && 'text-primary'
			)}
		>
			{col.headerIcon != null ? withHeaderIconClass(col.headerIcon) : null}
			{label}
			{isActive &&
				(sortDirection === SortDirection.ASC ? (
					<ArrowUp className={HEADER_ICON_CLASS} />
				) : (
					<ArrowDown className={HEADER_ICON_CLASS} />
				))}
		</button>
	);
}

function DataTableInner<T>({
	columns,
	data,
	getRowKey,
	isLoading = false,
	emptyState,
	emptyValue = EMPTY_VALUE,
	sortBy,
	sortDirection,
	onSort,
}: DataTableProps<T>): JSX.Element | null {
	if (isLoading) {
		return (
			<div className='space-y-3'>
				<Skeleton variant={SkeletonVariant.TableRow} count={SKELETON_PLACEHOLDER_COUNTS.LIST} />
			</div>
		);
	}

	if (data.length === 0 && emptyState) {
		return (
			<EmptyState data='items' title={emptyState.title} description={emptyState.description} showPlayNow={false} />
		);
	}

	if (data.length === 0) {
		return null;
	}

	return (
		<div className='rounded-md border overflow-x-auto'>
			<Table>
				<TableHeader>
					<TableRow>
						{columns.map(col => (
							<TableHead key={col.id} className={cn(col.headerClassName, 'font-medium text-foreground')}>
								{renderHeader(col, sortBy, sortDirection, onSort)}
							</TableHead>
						))}
					</TableRow>
				</TableHeader>
				<TableBody>
					{data.map(row => (
						<TableRow key={getRowKey(row)}>
							{columns.map(col => (
								<TableCell key={col.id} className={cn(getCellClassName(col), col.cellClassName)}>
									{renderCell(col, row, emptyValue)}
								</TableCell>
							))}
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}

export const DataTable = memo(DataTableInner) as typeof DataTableInner;
