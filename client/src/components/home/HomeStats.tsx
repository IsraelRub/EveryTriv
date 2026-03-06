import { useMemo } from 'react';
import { Brain, CalendarDays, ChartNoAxesCombined, GamepadIcon, Medal } from 'lucide-react';

import { formatNumericValue } from '@shared/utils';

import { ButtonSize, Colors, SkeletonVariant, StatCardVariant, VariantBase } from '@/constants';
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	EmptyState,
	Skeleton,
	StatsSectionCard,
} from '@/components';
import { useUserAnalytics } from '@/hooks';
import type { StatCardProps } from '@/types';

export function HomeStats() {
	const { data: analytics, isLoading, isError, refetch } = useUserAnalytics();
	const gameStats = analytics?.game;
	const performanceStats = analytics?.performance;
	const VARIANT = StatCardVariant.CENTERED;

	const stats = useMemo((): StatCardProps[] => {
		const streak: StatCardProps = {
			icon: CalendarDays,
			label: 'Current Streak',
			value: formatNumericValue(performanceStats?.streakDays, 0, ' days'),
			color: Colors.ORANGE_500.text,
			variant: VARIANT,
			animate: true,
		};
		const base: StatCardProps[] = [
			{
				icon: GamepadIcon,
				label: 'Total Games',
				value: formatNumericValue(gameStats?.totalGames, 0),
				color: Colors.BLUE_500.text,
				variant: VARIANT,
			},
			{
				icon: Brain,
				label: 'Success Rate',
				value: formatNumericValue(gameStats?.successRate, 0, '%'),
				color: Colors.GREEN_500.text,
				variant: VARIANT,
			},
			{
				icon: Medal,
				label: 'Best Score',
				value: formatNumericValue(gameStats?.bestScore, 0),
				color: Colors.YELLOW_500.text,
				variant: VARIANT,
			},
		];
		return [streak, ...base];
	}, [gameStats, performanceStats, VARIANT]);

	const isEmpty =
		!gameStats ||
		((gameStats.totalGames ?? 0) === 0 &&
			(gameStats.totalQuestionsAnswered ?? 0) === 0 &&
			(gameStats.totalScore ?? 0) === 0 &&
			(gameStats.bestScore ?? 0) === 0 &&
			(!Array.isArray(gameStats.recentActivity) || gameStats.recentActivity.length === 0));

	if (isLoading || isError || isEmpty) {
		const description = isError
			? 'Could not load your statistics'
			: isEmpty
				? 'Track your progress and achievements'
				: 'Your quick stats at a glance';
		return (
			<Card className='card-primary-tint'>
				<CardHeader>
					<CardTitle className='text-xl flex items-center gap-2'>
						<ChartNoAxesCombined className='h-5 w-5 text-primary' />
						Your Overview
					</CardTitle>
					<CardDescription>{description}</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<>
							<Skeleton variant={SkeletonVariant.TextLarge} className='mb-2' />
							<Skeleton variant={SkeletonVariant.InputMedium} />
						</>
					) : isError ? (
						<Button variant={VariantBase.OUTLINE} size={ButtonSize.SM} onClick={() => refetch()}>
							Try again
						</Button>
					) : (
						<EmptyState data='your statistics and progress' />
					)}
				</CardContent>
			</Card>
		);
	}

	return (
		<StatsSectionCard
			title='Your Overview'
			description='Your quick stats at a glance'
			titleIcon={ChartNoAxesCombined}
			stats={stats}
			variant={VARIANT}
			gridCols='grid-cols-2'
			isLoading={isLoading}
			className='card-primary-tint'
		/>
	);
}
