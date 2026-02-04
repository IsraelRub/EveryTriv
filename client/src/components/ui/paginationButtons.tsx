import { memo } from 'react';

import { ButtonSize, ButtonVariant } from '@/constants';
import { cn } from '@/utils';
import { Button } from './button';

export interface PaginationButtonsProps {
	onPrevious: () => void;
	onNext: () => void;
	hasPrevious: boolean;
	hasNext: boolean;
	currentPage?: number;
	totalPages?: number;
	disabled?: boolean;
	className?: string;
}

export const PaginationButtons = memo(function PaginationButtons({
	onPrevious,
	onNext,
	hasPrevious,
	hasNext,
	currentPage,
	totalPages,
	disabled = false,
	className,
}: PaginationButtonsProps) {
	const showPageInfo = currentPage != null && totalPages != null && totalPages > 0;

	return (
		<div className={cn('flex items-center gap-3', className)}>
			<Button
				variant={ButtonVariant.OUTLINE}
				size={ButtonSize.SM}
				onClick={onPrevious}
				disabled={!hasPrevious || disabled}
			>
				Previous
			</Button>
			{showPageInfo && (
				<span className='text-sm text-muted-foreground shrink-0'>
					Page <span className='font-bold text-foreground'>{currentPage}</span> of{' '}
					<span className='font-bold text-foreground'>{totalPages}</span>
				</span>
			)}
			<Button variant={ButtonVariant.OUTLINE} size={ButtonSize.SM} onClick={onNext} disabled={!hasNext || disabled}>
				Next
			</Button>
		</div>
	);
});
