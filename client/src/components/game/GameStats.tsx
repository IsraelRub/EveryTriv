import { Coins } from 'lucide-react';

import { UserRole } from '@shared/constants';

import { useCreditBalance, useUserRole } from '@/hooks';
import type { GameStatsProps } from '@/types';
import { cn } from '@/utils';

export function GameStats({ currentQuestionIndex, className }: GameStatsProps) {
	const userRole = useUserRole();
	const isAdmin = userRole === UserRole.ADMIN;
	const { data: creditBalance } = useCreditBalance();
	const remainingCredits = creditBalance?.totalCredits ?? 0;

	return (
		<div className={cn('flex items-center gap-3 text-sm', className)}>
			<span className='text-foreground font-medium'>Question {currentQuestionIndex + 1}</span>
			{!isAdmin && (
				<div className='flex items-center gap-1.5 text-muted-foreground'>
					<Coins className='w-3.5 h-3.5 text-yellow-500' />
					<span className='text-xs'>{remainingCredits}</span>
				</div>
			)}
		</div>
	);
}
