import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { cva } from 'class-variance-authority';

import { ComponentSize, GameKey, QUESTION_COUNTER_NUM_CLASS } from '@/constants';
import type { QuestionCounterProps } from '@/types';
import { cn } from '@/utils';

const questionCounterVariants = cva(
	'inline-flex items-center justify-center rounded-full border border-input bg-transparent text-foreground min-w-[9rem] [&_.question-counter-num]:tabular-nums',
	{
		variants: {
			size: {
				[ComponentSize.SM]: 'px-4 py-1.5 [&_.question-counter-num]:text-lg',
				[ComponentSize.MD]: 'px-5 py-1.5 [&_.question-counter-num]:text-xl',
				[ComponentSize.LG]: 'px-6 py-2 [&_.question-counter-num]:text-2xl',
			},
		},
		defaultVariants: {
			size: ComponentSize.MD,
		},
	}
);

export const QuestionCounter = memo(function QuestionCounter({
	current,
	total,
	size = ComponentSize.MD,
}: QuestionCounterProps) {
	const { t } = useTranslation();
	const showTotal = total !== undefined && total > 0;
	return (
		<span className={questionCounterVariants({ size })}>
			<span className='text-base text-muted-foreground'>
				{t(GameKey.QUESTION)}{' '}
				<span className={cn(QUESTION_COUNTER_NUM_CLASS, 'font-bold text-primary')}>{current}</span>
				{showTotal && (
					<>
						{` ${t(GameKey.QUESTION_OF)} `}
						<span className={cn(QUESTION_COUNTER_NUM_CLASS, 'font-semibold text-muted-foreground')}>{total}</span>
					</>
				)}
			</span>
		</span>
	);
});
