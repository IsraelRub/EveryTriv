import { memo } from 'react';
import { ArrowRight, Flame, GamepadIcon, Target, Timer, Trophy } from 'lucide-react';

import { formatForDisplay } from '@shared/utils';

import { BgColor, ButtonSize, ButtonVariant, StatCardVariant, TextColor } from '@/constants';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, StatCard } from '@/components';
import type { GameStatsCardProps } from '@/types';
import { formatPlayTime } from '@/utils';

export const GameStatsCard = memo(function GameStatsCard({
	gameStats,
	performanceStats,
	variant = StatCardVariant.HORIZONTAL,
	showStreak = false,
	showPlayTime = false,
	className,
	title = 'Game Statistics',
	description = 'Your overall game performance metrics',
	titleIcon: TitleIcon = GamepadIcon,
	showViewFullStatsButton = false,
	onViewFullStats,
	isLoading = false,
}: GameStatsCardProps) {
	const gridCols =
		variant === StatCardVariant.CENTERED ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';

	return (
		<Card className={className}>
			<CardHeader className={showViewFullStatsButton ? 'flex flex-row items-center justify-between pb-2' : undefined}>
				<div className={showViewFullStatsButton ? 'space-y-1' : undefined}>
					<CardTitle
						className={
							variant === StatCardVariant.CENTERED ? 'text-xl flex items-center gap-2' : 'flex items-center gap-2'
						}
					>
						{TitleIcon && <TitleIcon className='h-5 w-5' />}
						{title}
					</CardTitle>
					<CardDescription>{description}</CardDescription>
				</div>
				{showViewFullStatsButton && onViewFullStats && (
					<Button variant={ButtonVariant.GHOST} size={ButtonSize.SM} onClick={onViewFullStats} className='text-xs'>
						View Full Stats <ArrowRight className='w-3 h-3 ml-1' />
					</Button>
				)}
			</CardHeader>
			<CardContent>
				<div className={`grid ${gridCols} gap-4`}>
					{showStreak && (
						<StatCard
							icon={Flame}
							label='Current Streak'
							value={`${performanceStats?.streakDays ?? 0} Days`}
							color={TextColor.ORANGE_500}
							variant={variant}
							animate={variant === StatCardVariant.CENTERED}
							isLoading={isLoading}
						/>
					)}
					<StatCard
						icon={GamepadIcon}
						label='Total Games'
						value={gameStats?.totalGames ?? 0}
						color={BgColor.BLUE_500}
						variant={variant}
						countUp
						isLoading={isLoading}
					/>
					<StatCard
						icon={Target}
						label='Success Rate'
						value={`${variant === StatCardVariant.CENTERED ? Math.round(gameStats?.successRate ?? 0) : formatForDisplay(gameStats?.successRate ?? 0)}%`}
						subtext={
							variant === StatCardVariant.HORIZONTAL
								? `${gameStats?.correctAnswers ?? 0}/${gameStats?.totalQuestionsAnswered ?? 0} correct`
								: undefined
						}
						color={variant === StatCardVariant.CENTERED ? TextColor.GREEN_500 : BgColor.GREEN_500}
						variant={variant}
						isLoading={isLoading}
					/>
					<StatCard
						icon={Trophy}
						label='Best Score'
						value={gameStats?.bestScore ?? 0}
						color={BgColor.YELLOW_500}
						variant={variant}
						countUp
						isLoading={isLoading}
					/>
					{showPlayTime && (
						<StatCard
							icon={Timer}
							label='Total Play Time'
							value={formatPlayTime(gameStats?.totalPlayTime ?? 0, 'seconds')}
							color={BgColor.PURPLE_500}
							variant={variant}
							isLoading={isLoading}
						/>
					)}
				</div>
			</CardContent>
		</Card>
	);
});
