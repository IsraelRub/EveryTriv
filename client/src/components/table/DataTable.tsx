import { Fragment, memo, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { ArrowDown, ArrowUp } from 'lucide-react';

import { EMPTY_VALUE } from '@shared/constants';
import { formatDate, formatTitle, getDifficultyBadgeClasses } from '@shared/utils';
import { VALIDATORS } from '@shared/validation';

import {
	EMPTY_CELL_CLASS,
	HEADER_ICON_CLASS,
	SKELETON_PLACEHOLDER_COUNTS,
	SkeletonVariant,
	SortDirection,
	VariantBase,
} from '@/constants';
import { DataTableColumnType, type DataTableColumn, type DataTableProps } from '@/types';
import { cn, getDifficultyDisplayLabel } from '@/utils';
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
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';

function wrapHeaderIcon(node: ReactElement | null): ReactElement | null {
	if (node == null) return null;
	return <span className='inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4'>{node}</span>;
}

function renderCell<T>(
	column: DataTableColumn<T>,
	row: T,
	emptyValue: string,
	t: TFunction
): ReactElement | string | number | null {
	const type = column.type;
	const value = column.getValue?.(row);
	const formatted = column.format
		? column.format(value, row)
		: type === DataTableColumnType.BADGE_DIFFICULTY
			? getDifficultyDisplayLabel(String(value ?? ''), t)
			: String(value ?? '');
	const isEmpty = value == null || value === '' || formatted === emptyValue;

	switch (type) {
		case DataTableColumnType.CUSTOM:
			return column.render?.(row) ?? null;

		case DataTableColumnType.TEXT:
		case DataTableColumnType.TEXT_PRIMARY:
			if (isEmpty) return <span className={EMPTY_CELL_CLASS}>{emptyValue}</span>;
			return formatted;

		case DataTableColumnType.DATE: {
			const dateValue = value == null || VALIDATORS.string(value) || value instanceof Date ? value : undefined;
			return formatDate(dateValue, emptyValue);
		}

		case DataTableColumnType.DATE_OPTIONAL: {
			const dateDefault = column.dateDefaultValue ?? emptyValue;
			if (isEmpty) return <span className={EMPTY_CELL_CLASS}>{dateDefault}</span>;
			const dateValue = value == null || VALIDATORS.string(value) || value instanceof Date ? value : undefined;
			return formatDate(dateValue, dateDefault);
		}

		case DataTableColumnType.BADGE:
			if (isEmpty) return <span className={EMPTY_CELL_CLASS}>{emptyValue}</span>;
			return (
				<Badge variant={column.getBadgeVariant?.(row) ?? VariantBase.OUTLINE} className='shrink-0'>
					{formatted}
				</Badge>
			);

		case DataTableColumnType.BADGE_DIFFICULTY: {
			if (isEmpty) return <span className={EMPTY_CELL_CLASS}>{emptyValue}</span>;
			return (
				<Badge variant={VariantBase.OUTLINE} className={cn('shrink-0', getDifficultyBadgeClasses(value))}>
					{formatted}
				</Badge>
			);
		}

		case DataTableColumnType.BADGE_ROLE: {
			if (isEmpty) return <span className={EMPTY_CELL_CLASS}>{emptyValue}</span>;
			const roleKey = String(value ?? '').toLowerCase();
			const badgeClasses = column.roleBadgeClasses?.[roleKey] ?? 'border-muted text-muted-foreground';
			return (
				<Badge variant={VariantBase.OUTLINE} className={cn('shrink-0', badgeClasses)}>
					{formatted}
				</Badge>
			);
		}

		case DataTableColumnType.TRUNCATE: {
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
		case DataTableColumnType.TEXT_PRIMARY:
			return 'font-medium';
		case DataTableColumnType.DATE:
		case DataTableColumnType.DATE_OPTIONAL:
			return 'text-sm text-muted-foreground whitespace-nowrap';
		case DataTableColumnType.TRUNCATE:
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
): ReactElement {
	const isSortable = !!(col.sortField && onSort);
	const isActive = sortBy === col.sortField;
	const label = col.emptyHeader ? '' : (col.headerLabel ?? formatTitle(col.id));

	if (!isSortable) {
		return (
			<span className='flex items-center gap-2 w-full text-left'>
				{col.headerIcon != null ? wrapHeaderIcon(col.headerIcon) : null}
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
			{col.headerIcon != null ? wrapHeaderIcon(col.headerIcon) : null}
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
	expandedRowId = null,
	renderExpandedRow,
}: DataTableProps<T>): JSX.Element | null {
	const { t } = useTranslation();
	const expandEnabled = renderExpandedRow != null;

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
					{data.map(row => {
						const rowKey = getRowKey(row);
						const dataRow = (
							<TableRow key={`${rowKey}-data`}>
								{columns.map(col => (
									<TableCell key={col.id} className={cn(getCellClassName(col), col.cellClassName)}>
										{renderCell(col, row, emptyValue, t)}
									</TableCell>
								))}
							</TableRow>
						);

						if (!expandEnabled) {
							return <Fragment key={rowKey}>{dataRow}</Fragment>;
						}

						const expanded = renderExpandedRow(row);
						const isOpen = expandedRowId === rowKey;

						return (
							<Fragment key={rowKey}>
								{dataRow}
								<TableRow key={`${rowKey}-expand`} className='border-b border-border hover:bg-transparent'>
									<TableCell colSpan={columns.length} className='p-0 align-top'>
										<Collapsible open={isOpen}>
											<CollapsibleContent>{expanded}</CollapsibleContent>
										</Collapsible>
									</TableCell>
								</TableRow>
							</Fragment>
						);
					})}
				</TableBody>
			</Table>
		</div>
	);
}

export const DataTable = memo(DataTableInner) as typeof DataTableInner;
