import { getDifficultyDisplayText } from '@shared/validation';

import { Progress } from '@/components';
import type { DifficultyBarProps, TopicBarProps } from '@/types';
import { cn } from '@/utils';

export function Bar(props: DifficultyBarProps | TopicBarProps) {
	// Check if it's a DifficultyBar variant
	if ('difficulty' in props && 'successRate' in props) {
		const { difficulty, successRate, gamesPlayed, color, globalSuccessRate } = props;
		const difference = globalSuccessRate !== undefined ? successRate - globalSuccessRate : undefined;
		const isAboveAverage = difference !== undefined && difference > 0;
		const isBelowAverage = difference !== undefined && difference < 0;

		return (
			<div className='space-y-1'>
				<div className='flex justify-between text-sm'>
					<span className='font-medium'>{getDifficultyDisplayText(difficulty)}</span>
					<div className='flex items-center gap-2 text-muted-foreground'>
						{globalSuccessRate !== undefined && (
							<span className='text-xs'>
								You: {Math.round(successRate)}% | Avg: {Math.round(globalSuccessRate)}%
								{difference !== undefined && (
									<span
										className={cn(
											'ml-1',
											isAboveAverage ? 'text-green-500' : isBelowAverage ? 'text-red-500' : 'text-muted-foreground'
										)}
									>
										({isAboveAverage ? '+' : ''}
										{Math.round(difference)}%)
									</span>
								)}
							</span>
						)}
						{globalSuccessRate === undefined && (
							<span>
								{Math.round(successRate)}% success ({gamesPlayed} games)
							</span>
						)}
					</div>
				</div>
				<Progress value={successRate} className={cn('h-3', color)} />
			</div>
		);
	}

	// TopicBar variant
	if ('topic' in props && 'count' in props) {
		const { topic, count, maxCount } = props;
		const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;

		return (
			<div className='space-y-1'>
				<div className='flex justify-between text-sm'>
					<span className='font-medium'>{topic}</span>
					<span className='text-muted-foreground'>{count} games</span>
				</div>
				<Progress value={percentage} className='h-3' />
			</div>
		);
	}

	return null;
}
