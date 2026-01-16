import { forwardRef, type HTMLAttributes, type TdHTMLAttributes, type ThHTMLAttributes } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { ButtonSize, ButtonVariant } from '@/constants';
import type { TablePaginationProps } from '@/types';
import { cn } from '@/utils';
import { Button } from './button';

export const Table = forwardRef<HTMLTableElement, HTMLAttributes<HTMLTableElement>>(({ className, ...props }, ref) => (
	<div className='relative w-full overflow-auto'>
		<table ref={ref} className={cn('w-full caption-bottom text-sm', className)} {...props} />
	</div>
));
Table.displayName = 'Table';

export const TableHeader = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
	({ className, ...props }, ref) => <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />
);
TableHeader.displayName = 'TableHeader';

export const TableBody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
	({ className, ...props }, ref) => (
		<tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
	)
);
TableBody.displayName = 'TableBody';

export const TableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(
	({ className, ...props }, ref) => (
		<tr
			ref={ref}
			className={cn('border-b transition-colors data-[state=selected]:bg-muted hover:bg-muted/50', className)}
			{...props}
		/>
	)
);
TableRow.displayName = 'TableRow';

export const TableHead = forwardRef<HTMLTableCellElement, ThHTMLAttributes<HTMLTableCellElement>>(
	({ className, ...props }, ref) => (
		<th
			ref={ref}
			className={cn('h-12 px-4 text-left align-middle font-medium text-muted-foreground', className)}
			{...props}
		/>
	)
);
TableHead.displayName = 'TableHead';

export const TableCell = forwardRef<HTMLTableCellElement, TdHTMLAttributes<HTMLTableCellElement>>(
	({ className, ...props }, ref) => <td ref={ref} className={cn('p-4 align-middle', className)} {...props} />
);
TableCell.displayName = 'TableCell';

export function TablePagination({
	totalPages,
	totalItems,
	startIndex,
	endIndex,
	hasNextPage,
	hasPreviousPage,
	onNextPage,
	onPreviousPage,
	isLoading = false,
	itemsLabel = 'items',
}: TablePaginationProps) {
	if (totalPages <= 1) {
		return null;
	}

	return (
		<div className='flex items-center gap-2'>
			<Button
				variant={ButtonVariant.DEFAULT}
				size={ButtonSize.ICON}
				onClick={onPreviousPage}
				disabled={!hasPreviousPage || isLoading}
			>
				<ChevronLeft className='h-5 w-5' />
			</Button>
			<div className='text-sm text-muted-foreground whitespace-nowrap'>
				Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} {itemsLabel}
			</div>
			<Button
				variant={ButtonVariant.DEFAULT}
				size={ButtonSize.ICON}
				onClick={onNextPage}
				disabled={!hasNextPage || isLoading}
			>
				<ChevronRight className='h-5 w-5' />
			</Button>
		</div>
	);
}
TablePagination.displayName = 'TablePagination';
