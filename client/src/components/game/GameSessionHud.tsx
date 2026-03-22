import { memo, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { cva } from 'class-variance-authority';
import { Coins } from 'lucide-react';

import { Colors, GameKey, GameSessionHudCounterLayout, QUESTION_COUNTER_NUM_CLASS } from '@/constants';
import type { GameSessionHudProps } from '@/types';
import { cn } from '@/utils';
import { GameTimer } from './GameTimer';

const questionCounterVariants = cva(
	'inline-flex items-center justify-center rounded-full border border-input bg-transparent text-foreground min-w-[9rem] [&_.question-counter-num]:tabular-nums',
	{
		variants: {
			layout: {
				[GameSessionHudCounterLayout.SINGLE]: 'px-4 py-1.5 [&_.question-counter-num]:text-lg',
				[GameSessionHudCounterLayout.MULTIPLAYER]: 'px-5 py-1.5 [&_.question-counter-num]:text-xl',
			},
		},
		defaultVariants: {
			layout: GameSessionHudCounterLayout.SINGLE,
		},
	}
);

export const GameSessionHud = memo(function GameSessionHud({
	questionCurrent,
	questionTotal,
	counterLayout,
	showCreditBadge = false,
	totalCredits = 0,
	timerAside,
	...timerProps
}: GameSessionHudProps): ReactElement {
	const { t } = useTranslation();
	const showQuestionTotal = questionTotal !== undefined && questionTotal > 0;
	const { timerKey, ...gameTimerProps } = timerProps;
	const gameTimer = <GameTimer key={timerKey} {...gameTimerProps} />;

	return (
		<div className='flex-shrink-0'>
			<div className='mb-3 flex flex-col items-center text-center'>
				<div className='flex flex-wrap items-center justify-center gap-3'>
					<span className={questionCounterVariants({ layout: counterLayout })}>
						<span className='text-base text-muted-foreground'>
							{t(GameKey.QUESTION)}{' '}
							<span className={cn(QUESTION_COUNTER_NUM_CLASS, 'font-bold text-primary')}>{questionCurrent}</span>
							{showQuestionTotal && (
								<>
									{` ${t(GameKey.QUESTION_OF)} `}
									<span className={cn(QUESTION_COUNTER_NUM_CLASS, 'font-semibold text-muted-foreground')}>
										{questionTotal}
									</span>
								</>
							)}
						</span>
					</span>
					{showCreditBadge ? (
						<div className='flex flex-col items-center gap-0.5 text-sm text-muted-foreground'>
							<div className='flex items-center gap-1.5'>
								<Coins className={cn('h-3.5 w-3.5', Colors.YELLOW_500.text)} />
								<span className='text-xs tabular-nums'>{totalCredits}</span>
							</div>
						</div>
					) : null}
				</div>
			</div>
			{timerAside != null ? (
				<div className='mb-3 flex items-center justify-between gap-4'>
					<div className='min-w-0 flex-1'>{gameTimer}</div>
					{timerAside}
				</div>
			) : (
				gameTimer
			)}
		</div>
	);
});
