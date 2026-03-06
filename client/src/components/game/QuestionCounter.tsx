import { memo } from 'react';

import { ComponentSize } from '@/constants';
import type { QuestionCounterProps } from '@/types';
import { cn } from '@/utils';

const NUMBER_SIZE_CLASS: Partial<Record<ComponentSize, string>> = {
	[ComponentSize.SM]: 'text-lg',
	[ComponentSize.MD]: 'text-xl',
	[ComponentSize.LG]: 'text-2xl',
};

export const QuestionCounter = memo(function QuestionCounter({
	current,
	total,
	size = ComponentSize.MD,
}: QuestionCounterProps) {
	const numberClass = NUMBER_SIZE_CLASS[size] ?? NUMBER_SIZE_CLASS[ComponentSize.MD];
	return (
		<span
			className={cn(
				'inline-flex items-center rounded-full border border-input bg-transparent px-3 py-1.5 text-foreground',
				size === ComponentSize.SM && 'px-2.5 py-1',
				size === ComponentSize.LG && 'px-4 py-2'
			)}
		>
			<span className='text-base text-muted-foreground'>
				{'Question '}
				<span className={cn('font-bold text-primary tabular-nums', numberClass)}>{current}</span>
				{' of '}
				<span className={cn('font-semibold text-muted-foreground tabular-nums', numberClass)}>{total}</span>
			</span>
		</span>
	);
});
