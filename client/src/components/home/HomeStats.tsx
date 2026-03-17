import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Binoculars, Brain, CalendarDays, GamepadIcon, Medal } from 'lucide-react';

import { formatNumericValue } from '@shared/utils';

import { ButtonSize, Colors, CommonKey, HomeKey, SkeletonVariant, StatCardVariant, VariantBase } from '@/constants';
import type { StatCardProps } from '@/types';
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

export function HomeStats() {
	const { t } = useTranslation(['home', 'common']);
	const { data: analytics, isLoading, isError, refetch } = useUserAnalytics();
	const gameStats = analytics?.game;
	const performanceStats = analytics?.performance;
	const VARIANT = StatCardVariant.CENTERED;

	const stats = useMemo((): StatCardProps[] => {
		const streak: StatCardProps = {
			icon: CalendarDays,
			label: t(HomeKey.CURRENT_STREAK),
			value: formatNumericValue(performanceStats?.streakDays, 0, ` ${t(CommonKey.DAYS)}`),
			color: Colors.ORANGE_500.text,
			variant: VARIANT,
			animate: true,
		};
		const base: StatCardProps[] = [
			{
				icon: GamepadIcon,
				label: t(HomeKey.TOTAL_GAMES),
				value: formatNumericValue(gameStats?.totalGames, 0),
				color: Colors.BLUE_500.text,
				variant: VARIANT,
			},
			{
				icon: Brain,
				label: t(HomeKey.SUCCESS_RATE),
				value: formatNumericValue(gameStats?.successRate, 0, '%'),
				color: Colors.GREEN_500.text,
				variant: VARIANT,
			},
			{
				icon: Medal,
				label: t(HomeKey.BEST_SCORE),
				value: formatNumericValue(gameStats?.bestScore, 0),
				color: Colors.YELLOW_500.text,
				variant: VARIANT,
			},
		];
		return [streak, ...base];
	}, [t, gameStats, performanceStats, VARIANT]);

	const isEmpty =
		!gameStats ||
		((gameStats.totalGames ?? 0) === 0 &&
			(gameStats.totalQuestionsAnswered ?? 0) === 0 &&
			(gameStats.totalScore ?? 0) === 0 &&
			(gameStats.bestScore ?? 0) === 0 &&
			(!Array.isArray(gameStats.recentActivity) || gameStats.recentActivity.length === 0));

	if (isLoading || isError || isEmpty) {
		const description = isError
			? t(HomeKey.STATS_LOAD_ERROR)
			: isEmpty
				? t(HomeKey.TRACK_PROGRESS_CTA)
				: t(HomeKey.QUICK_STATS_AT_GLANCE);
		return (
			<Card className='card-primary-tint'>
				<CardHeader>
					<CardTitle className='text-xl flex items-center gap-2'>
						<Binoculars className='h-5 w-5 text-primary' />
						{t(HomeKey.YOUR_OVERVIEW)}
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
							{t(HomeKey.TRY_AGAIN)}
						</Button>
					) : (
						<EmptyState
							data='stats'
							title={t(HomeKey.YOUR_OVERVIEW)}
							description={t(HomeKey.EMPTY_STATS_DESCRIPTION)}
						/>
					)}
				</CardContent>
			</Card>
		);
	}

	return (
		<StatsSectionCard
			title={t(HomeKey.YOUR_OVERVIEW)}
			description={t(HomeKey.QUICK_STATS_AT_GLANCE)}
			titleIcon={Binoculars}
			stats={stats}
			variant={VARIANT}
			gridCols='grid-cols-2'
			isLoading={isLoading}
			className='card-primary-tint'
		/>
	);
}
