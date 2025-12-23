import { Crown, Medal } from 'lucide-react';

import type { RankBadgeProps } from '@/types';

export function RankBadge({ rank }: RankBadgeProps) {
	switch (rank) {
		case 1:
			return <Crown className='h-6 w-6 text-yellow-500' />;
		case 2:
			return <Medal className='h-6 w-6 text-gray-400' />;
		case 3:
			return <Medal className='h-6 w-6 text-amber-600' />;
		default:
			return <span className='text-lg font-bold text-muted-foreground w-6 text-center'>{rank}</span>;
	}
}
