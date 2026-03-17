import { useTranslation } from 'react-i18next';
import { Calendar, Clock, Star, User, Users } from 'lucide-react';

import { GameMode } from '@shared/constants';
import { formatDate, formatTitle, getDifficultyBadgeClasses } from '@shared/utils';

import {
	Colors,
	GameKey,
	HomeKey,
	SKELETON_PLACEHOLDER_COUNTS,
	SkeletonVariant,
	VariantBase,
	ViewAllDestination,
} from '@/constants';
import { cn, getDifficultyDisplayLabel } from '@/utils';
import {
	Badge,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	EmptyState,
	Skeleton,
	ViewAllButton,
} from '@/components';
import { useGameHistory } from '@/hooks';

export function RecentGames() {
	const { t } = useTranslation();
	const { data: historyData, isLoading } = useGameHistory(3, 0);
	const recentGames = Array.isArray(historyData) ? historyData : [];

	return (
		<Card className='h-full flex flex-col'>
			<CardHeader className='flex flex-row items-center justify-between pb-2'>
				<div className='space-y-1'>
					<CardTitle className='text-xl flex items-center gap-2'>
						<Clock className='w-5 h-5 text-primary' />
						{t(HomeKey.RECENT_GAMES)}
					</CardTitle>
					<CardDescription>{t(HomeKey.RECENT_GAMES_DESC)}</CardDescription>
				</div>
				<ViewAllButton destination={ViewAllDestination.HISTORY} visible={recentGames.length > 0} />
			</CardHeader>
			<CardContent className='flex-1'>
				{isLoading ? (
					<div className='space-y-4'>
						<Skeleton variant={SkeletonVariant.Row} count={SKELETON_PLACEHOLDER_COUNTS.MEDIUM} />
					</div>
				) : recentGames.length > 0 ? (
					<div className='space-y-4'>
						{recentGames.map(game => (
							<div
								key={game.id}
								className='flex items-center justify-between p-3 rounded-lg bg-muted/50 transition-colors hover-row'
							>
								<div className='space-y-1'>
									<div className='flex items-center gap-2 text-sm font-medium'>
										<Star className={cn('w-3 h-3', Colors.YELLOW_500.text)} fill='currentColor' strokeWidth={0} />
										<span>
											{game.score} {t(HomeKey.POINTS)}
										</span>
									</div>
									<div className='flex items-center gap-2 text-xs text-muted-foreground'>
										<Calendar className='w-3 h-3' />
										<span>{formatDate(game.createdAt)}</span>
									</div>
								</div>
								<div className='text-right shrink-0 flex flex-col items-end gap-1'>
									<Badge variant={VariantBase.OUTLINE} className='shrink-0'>
										{formatTitle(game.topic ?? t(GameKey.DEFAULT_TOPIC))}
									</Badge>
									<Badge
										variant={VariantBase.OUTLINE}
										className={cn('shrink-0', getDifficultyBadgeClasses(game.difficulty))}
									>
										{getDifficultyDisplayLabel(game.difficulty, t)}
									</Badge>
									<span className='text-[10px] text-muted-foreground flex items-center gap-1 justify-end'>
										{game.gameMode === GameMode.MULTIPLAYER ? (
											<>
												<Users className='w-3 h-3 shrink-0' />
												{t(GameKey.MULTIPLAYER)}
											</>
										) : (
											<>
												<User className='w-3 h-3 shrink-0' />
												{t(GameKey.SINGLE_PLAYER)}
											</>
										)}
									</span>
								</div>
							</div>
						))}
					</div>
				) : (
					<div className='h-full'>
						<EmptyState
							data='recent games'
							title={t(HomeKey.NO_RECENT_GAMES)}
							description={t(HomeKey.NO_RECENT_GAMES_DESCRIPTION)}
						/>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
