import { memo } from 'react';
import { motion } from 'framer-motion';

import { TIME_PERIODS_MS } from '@shared/constants';
import { VALIDATORS } from '@shared/validation';

import { DEFAULT_STATS_GRID_COLS, SkeletonVariant, StatCardVariant, StatsSectionLayout } from '@/constants';
import type { StatCardProps, StatsSectionCardProps } from '@/types';
import { cn } from '@/utils';
import { Card, CardContent, SectionCard, Skeleton } from '@/components';
import { useCountUp } from '@/hooks';
import { useRefreshAnimationGeneration } from '@/contexts';

export const StatCard = memo(function StatCard({
	icon: Icon,
	label,
	value,
	subtext,
	color,
	suffix,
	isLoading,
	variant = StatCardVariant.HORIZONTAL,
	animate = false,
}: StatCardProps) {
	const numericValue = VALIDATORS.number(value) ? value : 0;
	const countUpEnabled = VALIDATORS.number(value);
	const refreshGeneration = useRefreshAnimationGeneration();

	const animatedValue = useCountUp(numericValue, {
		duration: TIME_PERIODS_MS.FIVE_SECONDS,
		enabled: countUpEnabled,
		resetTrigger: countUpEnabled ? refreshGeneration : undefined,
	});

	// Use animated value if count-up is enabled and value is numeric, otherwise use original value
	const displayValue = countUpEnabled ? animatedValue : value;

	switch (variant) {
		case StatCardVariant.HORIZONTAL:
			if (isLoading) {
				return (
					<Card className='overflow-hidden'>
						<CardContent className='pt-6 overflow-hidden'>
							<div className='flex items-center gap-4 overflow-hidden'>
								<Skeleton variant={SkeletonVariant.IconLarge} className='rounded-lg flex-shrink-0' />
								<div className='flex-1 space-y-2 overflow-hidden min-w-0'>
									<Skeleton variant={SkeletonVariant.TextLarge} className='max-w-full' />
									<Skeleton variant={SkeletonVariant.Text} className='max-w-full' />
								</div>
							</div>
						</CardContent>
					</Card>
				);
			}
			return (
				<Card>
					<CardContent className='pt-6'>
						<div className='flex flex-col gap-2'>
							<div className='flex items-center gap-3'>
								<Icon className={cn('h-8 w-8 flex-shrink-0', color)} strokeWidth={2.25} />
								<p className='text-sm text-muted-foreground leading-none'>{label}</p>
							</div>
							<div>
								<p className='text-2xl font-bold'>
									{VALIDATORS.number(displayValue) ? displayValue.toLocaleString() : displayValue}
									{suffix}
								</p>
								{subtext && <p className='text-xs text-muted-foreground'>{subtext}</p>}
							</div>
						</div>
					</CardContent>
				</Card>
			);
		case StatCardVariant.CENTERED:
		default: {
			if (isLoading) {
				return (
					<div className='text-center p-4 rounded-lg bg-muted/50'>
						<Skeleton variant={SkeletonVariant.Icon} className='rounded mx-auto mb-2' />
						<Skeleton variant={SkeletonVariant.TextLarge} className='mx-auto mb-2' />
						<Skeleton variant={SkeletonVariant.TextWithSmallWidth} className='mx-auto' />
					</div>
				);
			}
			const centeredContent = (
				<div className='text-center p-4 rounded-lg bg-muted/50 transition-colors hover-row'>
					<div className='flex items-center justify-center gap-3 mb-2'>
						<Icon className={cn('h-8 w-8 flex-shrink-0', color)} strokeWidth={2.25} />
						<p className='text-sm text-muted-foreground leading-none'>{label}</p>
					</div>
					<p className='text-3xl font-bold'>
						{VALIDATORS.number(displayValue) ? displayValue.toLocaleString() : displayValue}
						{suffix}
					</p>
				</div>
			);
			return animate ? (
				<motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
					{centeredContent}
				</motion.div>
			) : (
				centeredContent
			);
		}
	}
});

export const StatsSectionCard = memo(function StatsSectionCard({
	title,
	description,
	titleIcon: TitleIcon,
	stats,
	variant = StatCardVariant.HORIZONTAL,
	gridCols = DEFAULT_STATS_GRID_COLS,
	isLoading: sectionLoading,
	className,
	layout = StatsSectionLayout.SECTION,
}: StatsSectionCardProps) {
	const grid = (
		<div className={cn('grid gap-4', gridCols)}>
			{stats.map(stat => (
				<StatCard
					key={stat.label}
					{...stat}
					variant={stat.variant ?? variant}
					animate={stat.animate ?? variant === StatCardVariant.CENTERED}
					isLoading={stat.isLoading ?? sectionLoading}
				/>
			))}
		</div>
	);

	if (layout === StatsSectionLayout.PLAIN) {
		return <div className={className}>{grid}</div>;
	}

	return (
		<SectionCard className={className} title={title ?? ''} icon={TitleIcon} description={description}>
			{grid}
		</SectionCard>
	);
});
