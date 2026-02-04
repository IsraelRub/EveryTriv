import { useNavigate } from 'react-router-dom';
import { ArrowRight, Trophy } from 'lucide-react';

import { ButtonSize, ButtonVariant, ROUTES } from '@/constants';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, LeaderboardTable } from '@/components';
import { useGlobalLeaderboard } from '@/hooks';

export function LeaderboardPreview() {
	const navigate = useNavigate();
	const { data: globalData, isLoading } = useGlobalLeaderboard();
	const topPlayers = Array.isArray(globalData) ? globalData.slice(0, 5) : [];

	return (
		<Card className='h-full flex flex-col'>
			<CardHeader className='flex flex-row items-center justify-between pb-2'>
				<div className='space-y-1'>
					<CardTitle className='text-xl flex items-center gap-2'>
						<Trophy className='w-5 h-5 text-primary' />
						Top Players
					</CardTitle>
					<CardDescription>Global leaders this week</CardDescription>
				</div>
				<Button
					variant={ButtonVariant.GHOST}
					size={ButtonSize.SM}
					onClick={() => navigate(ROUTES.STATISTICS)}
					className='text-xs'
				>
					View Full <ArrowRight className='w-3 h-3 ml-1' />
				</Button>
			</CardHeader>
			<CardContent className='flex-1'>
				<LeaderboardTable entries={topPlayers} isLoading={isLoading} />
			</CardContent>
		</Card>
	);
}
