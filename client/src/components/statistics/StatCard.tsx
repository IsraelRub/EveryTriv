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
	stackIconLabel = false,
	compact = false,
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
							{stackIconLabel ? (
								<div className='flex flex-col gap-3 overflow-hidden'>
									<Skeleton variant={SkeletonVariant.IconLarge} className='rounded-lg flex-shrink-0 self-start' />
									<div className='space-y-2 overflow-hidden min-w-0'>
										<Skeleton variant={SkeletonVariant.Text} className='max-w-full' />
										<Skeleton variant={SkeletonVariant.TextLarge} className='max-w-full' />
									</div>
								</div>
							) : (
								<div className='flex items-center gap-4 overflow-hidden'>
									<Skeleton variant={SkeletonVariant.IconLarge} className='rounded-lg flex-shrink-0' />
									<div className='flex-1 space-y-2 overflow-hidden min-w-0'>
										<Skeleton variant={SkeletonVariant.TextLarge} className='max-w-full' />
										<Skeleton variant={SkeletonVariant.Text} className='max-w-full' />
									</div>
								</div>
							)}
						</CardContent>
					</Card>
				);
			}
			return (
				<Card>
					<CardContent className='pt-6'>
						<div className='flex flex-col gap-2'>
							<div className={cn(stackIconLabel ? 'flex flex-col items-start gap-1.5' : 'flex items-center gap-3')}>
								<Icon className={cn('h-8 w-8 flex-shrink-0', color)} strokeWidth={2.25} />
								<p
									className={cn(
										'text-sm text-muted-foreground leading-none',
										stackIconLabel && 'text-start leading-snug'
									)}
								>
									{label}
								</p>
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
		case StatCardVariant.PROSE:
			if (isLoading) {
				return (
					<Card className='overflow-hidden'>
						<CardContent className='pt-6 overflow-hidden'>
							{stackIconLabel ? (
								<div className='flex flex-col gap-3 overflow-hidden'>
									<Skeleton variant={SkeletonVariant.IconLarge} className='rounded-lg flex-shrink-0 self-start' />
									<div className='space-y-2 overflow-hidden min-w-0'>
										<Skeleton variant={SkeletonVariant.Text} className='max-w-full' />
										<Skeleton variant={SkeletonVariant.TextLarge} className='max-w-full' />
									</div>
								</div>
							) : (
								<div className='flex items-start gap-4 overflow-hidden'>
									<Skeleton variant={SkeletonVariant.IconLarge} className='rounded-lg flex-shrink-0' />
									<div className='flex-1 space-y-2 overflow-hidden min-w-0'>
										<Skeleton variant={SkeletonVariant.Text} className='max-w-full' />
										<Skeleton variant={SkeletonVariant.TextLarge} className='max-w-full' />
										<Skeleton variant={SkeletonVariant.Text} className='max-w-full' />
									</div>
								</div>
							)}
						</CardContent>
					</Card>
				);
			}
			return (
				<Card>
					<CardContent className='pt-6'>
						<div className='flex flex-col gap-2'>
							<div className={cn(stackIconLabel ? 'flex flex-col items-start gap-1.5' : 'flex items-center gap-3')}>
								<Icon className={cn('h-8 w-8 flex-shrink-0', color)} strokeWidth={2.25} />
								<p className={cn('text-sm text-muted-foreground leading-snug', stackIconLabel && 'text-start')}>
									{label}
								</p>
							</div>
							<div className='min-w-0'>
								<p className='text-sm font-normal leading-relaxed text-foreground break-words'>
									{VALIDATORS.number(displayValue) ? displayValue.toLocaleString() : displayValue}
									{suffix}
								</p>
								{subtext != null && subtext !== '' ? (
									<p className='mt-2 text-xs text-muted-foreground'>{subtext}</p>
								) : null}
							</div>
						</div>
					</CardContent>
				</Card>
			);
		case StatCardVariant.CENTERED:
		default: {
			if (isLoading) {
				return (
					<div className={cn('text-center rounded-lg bg-muted/50', compact ? 'p-3' : 'p-4')}>
						<Skeleton variant={SkeletonVariant.Icon} className='rounded mx-auto mb-2' />
						<Skeleton variant={SkeletonVariant.TextLarge} className='mx-auto mb-2' />
						<Skeleton variant={SkeletonVariant.TextWithSmallWidth} className='mx-auto' />
					</div>
				);
			}
			const centeredContent = (
				<div className={cn('text-center rounded-lg bg-muted/50 transition-colors hover-row', compact ? 'p-3' : 'p-4')}>
					<div
						className={cn(
							'mb-2 flex justify-center',
							stackIconLabel ? 'flex-col items-center gap-1.5' : 'items-center gap-3'
						)}
					>
						<Icon className={cn(compact ? 'h-7 w-7' : 'h-8 w-8', 'flex-shrink-0', color)} strokeWidth={2.25} />
						<p
							className={cn(
								compact ? 'text-xs text-muted-foreground' : 'text-sm text-muted-foreground',
								stackIconLabel ? 'max-w-full text-center leading-snug' : 'leading-none'
							)}
						>
							{label}
						</p>
					</div>
					<p className={cn('font-bold', compact ? 'min-w-0 break-words px-0.5 text-xl sm:text-2xl' : 'text-3xl')}>
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
	const gridColMatches = [...gridCols.matchAll(/grid-cols-(\d+)/g)];
	const maxGridCols =
		gridColMatches.length === 0 ? 1 : Math.max(...gridColMatches.map(m => Number.parseInt(m[1] ?? '1', 10)));
	const stackIconLabel = maxGridCols >= 4;
	const grid = (
		<div className={cn('grid gap-4', gridCols)}>
			{stats.map(stat => (
				<StatCard
					key={stat.label}
					{...stat}
					variant={stat.variant ?? variant}
					animate={stat.animate ?? variant === StatCardVariant.CENTERED}
					isLoading={stat.isLoading ?? sectionLoading}
					stackIconLabel={stat.stackIconLabel ?? stackIconLabel}
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
