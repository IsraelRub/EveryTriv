import { useNavigate } from 'react-router-dom';
import { ArrowRight, Calendar, Clock, Trophy } from 'lucide-react';

import { ButtonSize, ButtonVariant, ROUTES, SKELETON_HEIGHTS, SKELETON_WIDTHS } from '@/constants';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState, Skeleton } from '@/components';
import { useGameHistory } from '@/hooks';
import { formatDate } from '@/utils';

export function RecentGames() {
	const navigate = useNavigate();
	const { data: historyData, isLoading } = useGameHistory(3, 0);
	const recentGames = Array.isArray(historyData) ? historyData : [];

	if (isLoading) {
		return (
			<Card className='h-full'>
				<CardHeader>
					<CardTitle className='text-xl'>Recent Games</CardTitle>
				</CardHeader>
				<CardContent className='space-y-4'>
					{[...Array(3)].map((_, i) => (
						<Skeleton key={i} className={`${SKELETON_HEIGHTS.ROW} ${SKELETON_WIDTHS.FULL}`} />
					))}
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className='h-full flex flex-col'>
			<CardHeader className='flex flex-row items-center justify-between pb-2'>
				<div className='space-y-1'>
					<CardTitle className='text-xl flex items-center gap-2'>
						<Clock className='w-5 h-5 text-primary' />
						Recent Games
					</CardTitle>
					<CardDescription>Your last played games</CardDescription>
				</div>
				<Button
					variant={ButtonVariant.GHOST}
					size={ButtonSize.SM}
					onClick={() => navigate(ROUTES.STATISTICS)}
					className='text-xs'
				>
					View All <ArrowRight className='w-3 h-3 ml-1' />
				</Button>
			</CardHeader>
			<CardContent className='flex-1'>
				{recentGames.length > 0 ? (
					<div className='space-y-4'>
						{recentGames.map(game => (
							<div
								key={game.id}
								className='flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors'
							>
								<div className='space-y-1'>
									<div className='flex items-center gap-2 text-sm font-medium'>
										<Trophy className='w-3 h-3 text-yellow-500' />
										<span>{game.score} points</span>
									</div>
									<div className='flex items-center gap-2 text-xs text-muted-foreground'>
										<Calendar className='w-3 h-3' />
										<span>{formatDate(game.createdAt)}</span>
									</div>
								</div>
								<div className='text-right'>
									<div className='text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary uppercase'>
										{game.difficulty}
									</div>
								</div>
							</div>
						))}
					</div>
				) : (
					<div className='h-full'>
						<EmptyState data='recent games' />
					</div>
				)}
			</CardContent>
		</Card>
	);
}
