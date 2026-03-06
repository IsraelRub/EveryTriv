import { memo, type ReactNode } from 'react';

import { SKELETON_PLACEHOLDER_COUNTS, SkeletonVariant } from '@/constants';
import { Card, CardContent, CardHeader, EmptyState, PaginationButtons, Skeleton } from '@/components';
import type { DataTableCardHeaderProps, DataTableCardProps } from '@/types';
import { DataTable } from './DataTable';

/** Single source of truth for table card: wrapper, header layout, filters bar, content spacing. */
function TableCardHeaderLayout({
	title,
	description,
	toolbar,
	pagination,
	actions,
}: DataTableCardHeaderProps): JSX.Element {
	const showPagination = pagination !== null && pagination.totalPages > 1;

	return (
		<div className='flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between'>
			<div className='min-w-0 space-y-1.5'>
				{title}
				{description ?? null}
			</div>
			{toolbar != null ? <div className='flex min-w-0 flex-1 basis-0 justify-center'>{toolbar}</div> : null}
			<div className='flex w-full items-center justify-end gap-2 sm:w-auto sm:justify-start'>
				{showPagination && pagination !== null && <PaginationButtons {...pagination} />}
				{actions}
			</div>
		</div>
	);
}

function DataTableCardInner<T>({
	header,
	filters,
	useCard = true,
	isLoading,
	data,
	emptyState,
	...tableProps
}: DataTableCardProps<T>): JSX.Element {
	const headerBlock = <TableCardHeaderLayout {...header} />;
	const filtersBlock = filters != null ? <div className='flex flex-wrap items-center gap-4'>{filters}</div> : null;

	const tableContent = ((): ReactNode => {
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
		return <DataTable<T> {...tableProps} data={data} emptyState={emptyState} isLoading={false} />;
	})();

	const contentBlock = (
		<>
			{filtersBlock}
			{tableContent}
		</>
	);

	if (useCard) {
		return (
			<Card className='card-muted-tint'>
				<CardHeader>{headerBlock}</CardHeader>
				<CardContent className='space-y-6'>{contentBlock}</CardContent>
			</Card>
		);
	}

	return (
		<>
			{headerBlock}
			<div className='mt-4 space-y-6'>
				{filtersBlock}
				{tableContent}
			</div>
		</>
	);
}

export const DataTableCard = memo(DataTableCardInner) as typeof DataTableCardInner;
