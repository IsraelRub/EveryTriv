import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components';
import type { LeaderboardTableProps } from '@/types';
import { cn, getAvatarUrl, getUserInitials } from '@/utils';
import { RankBadge } from './RankBadge';
import { LeaderboardSkeleton } from './skeleton';

export function LeaderboardTable({ entries, isLoading }: LeaderboardTableProps) {
	if (isLoading) {
		return <LeaderboardSkeleton />;
	}

	// Ensure entries is an array
	const entriesArray = Array.isArray(entries) ? entries : [];

	if (!entriesArray || entriesArray.length === 0) {
		return (
			<div className='text-center py-8 text-muted-foreground'>
				<Trophy className='h-12 w-12 mx-auto mb-4 opacity-50' />
				<p>No leaderboard data available yet</p>
			</div>
		);
	}

	return (
		<div className='space-y-2'>
			{entriesArray.map((entry, index) => (
				<motion.div
					key={entry.userId}
					initial={{ opacity: 0, x: -20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ delay: index * 0.05 }}
					className={cn(
						'flex items-center gap-4 p-3 rounded-lg transition-colors',
						index < 3 ? 'bg-muted/50' : 'hover:bg-muted/30'
					)}
				>
					<RankBadge rank={entry.rank} />
					<Avatar className='h-10 w-10'>
						<AvatarImage src={getAvatarUrl(entry.avatar)} />
						<AvatarFallback>{getUserInitials(entry.firstName, entry.lastName, entry.email)}</AvatarFallback>
					</Avatar>
					<div className='flex-1 min-w-0'>
						<p className='font-medium truncate'>
							{entry.firstName && entry.lastName ? `${entry.firstName} ${entry.lastName}` : entry.email.split('@')[0]}
						</p>
						<p className='text-sm text-muted-foreground'>
							{entry.gamesPlayed} games • {Math.round(entry.successRate)}% success
						</p>
					</div>
					<div className='text-right'>
						<p className='font-bold text-lg'>{entry.score.toLocaleString()}</p>
						<p className='text-xs text-muted-foreground'>points</p>
					</div>
				</motion.div>
			))}
		</div>
	);
}
