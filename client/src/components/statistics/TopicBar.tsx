import { Progress } from '@/components';

import type { TopicBarProps } from '@/types';

export function TopicBar({ topic, count, maxCount }: TopicBarProps) {
	const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;

	return (
		<div className='space-y-1'>
			<div className='flex justify-between text-sm'>
				<span className='font-medium'>{topic}</span>
				<span className='text-muted-foreground'>{count} games</span>
			</div>
			<Progress value={percentage} className='h-2' />
		</div>
	);
}
