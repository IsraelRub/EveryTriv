import { createElement, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

import { getDisplayNameFromUserFields } from '@shared/utils';

import {
	ANIMATION_DELAYS,
	AvatarSize,
	DISPLAY_NAME_FALLBACKS,
	RANK_DISPLAY,
	StatisticsLeaderboardKey,
} from '@/constants';
import type { LeaderboardTableProps } from '@/types';
import { cn } from '@/utils';
import { EmptyState, UserAvatar } from '@/components';
import { LeaderboardSkeleton } from '../skeleton';

export const LeaderboardTable = memo(function LeaderboardTable({ entries, isLoading }: LeaderboardTableProps) {
	const { t } = useTranslation();
	if (isLoading) {
		return <LeaderboardSkeleton />;
	}

	// Ensure entries is an array
	const entriesArray = Array.isArray(entries) ? entries : [];

	if (!entriesArray || entriesArray.length === 0) {
		return (
			<EmptyState
				data='leaderboard'
				title={t(StatisticsLeaderboardKey.NO_LEADERBOARD_DATA_TITLE)}
				description={t(StatisticsLeaderboardKey.NO_LEADERBOARD_DATA_DESCRIPTION)}
				showPlayNow={false}
			/>
		);
	}

	return (
		<div className='space-y-2'>
			{entriesArray.map((entry, index) => {
				const display =
					entry.rank === 1
						? RANK_DISPLAY[1]
						: entry.rank === 2
							? RANK_DISPLAY[2]
							: entry.rank === 3
								? RANK_DISPLAY[3]
								: null;
				return (
					<motion.div
						key={entry.userId}
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: index * ANIMATION_DELAYS.STAGGER_SMALL }}
						className={cn(
							'flex items-center gap-4 p-3 rounded-lg transition-colors',
							index < 3 ? 'bg-muted/50' : 'hover-row'
						)}
					>
						{display ? (
							createElement(display.icon, { className: cn('h-6 w-6', display.textColor) })
						) : (
							<span className='text-lg font-bold w-6 text-center text-muted-foreground'>{entry.rank}</span>
						)}
						<UserAvatar source={entry} size={AvatarSize.MD} fallbackLetter={DISPLAY_NAME_FALLBACKS.USER_SHORT} />
						<div className='flex-1 min-w-0'>
							<p className='font-medium truncate'>{getDisplayNameFromUserFields(entry)}</p>
							<p className='text-sm text-muted-foreground'>
								{t(StatisticsLeaderboardKey.GAMES_AND_SUCCESS, {
									games: entry.gamesPlayed,
									percent: Math.round(entry.successRate),
								})}
							</p>
						</div>
						<div className='text-right'>
							<p className='font-bold text-lg'>
								{(entry.score > 0 ? entry.score : (entry.bestScore ?? 0)).toLocaleString()}
							</p>
							<p className='text-xs text-muted-foreground'>{t(StatisticsLeaderboardKey.POINTS)}</p>
						</div>
					</motion.div>
				);
			})}
		</div>
	);
});
