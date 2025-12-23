import { Progress } from '@/components';

import type { DifficultyBarProps } from '@/types';

export function DifficultyBar({ difficulty, successRate, gamesPlayed, color, globalSuccessRate }: DifficultyBarProps) {
	const difference = globalSuccessRate !== undefined ? successRate - globalSuccessRate : undefined;
	const isAboveAverage = difference !== undefined && difference > 0;
	const isBelowAverage = difference !== undefined && difference < 0;

	return (
		<div className='space-y-1'>
			<div className='flex justify-between text-sm'>
				<span className='font-medium capitalize'>{difficulty}</span>
				<div className='flex items-center gap-2 text-muted-foreground'>
					{globalSuccessRate !== undefined && (
						<span className='text-xs'>
							You: {Math.round(successRate)}% | Avg: {Math.round(globalSuccessRate)}%
							{difference !== undefined && (
								<span
									className={`ml-1 ${
										isAboveAverage ? 'text-green-500' : isBelowAverage ? 'text-red-500' : 'text-muted-foreground'
									}`}
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
			<Progress value={successRate} className={`h-2 ${color}`} />
		</div>
	);
}
