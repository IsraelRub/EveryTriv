import { Coins } from 'lucide-react';

import { Colors } from '@/constants';
import type { GameCreditBadgeProps } from '@/types';
import { cn } from '@/utils';

export function GameCreditBadge({ totalCredits, className }: GameCreditBadgeProps) {
	return (
		<div className={cn('flex items-center gap-1.5 text-muted-foreground text-sm', className)}>
			<Coins className={cn('w-3.5 h-3.5', Colors.YELLOW_500.text)} fill='currentColor' strokeWidth={0} />
			<span className='text-xs'>{totalCredits}</span>
		</div>
	);
}
