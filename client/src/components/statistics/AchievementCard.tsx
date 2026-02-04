import { memo } from 'react';

import { AchievementCardVariant, VariantBase } from '@/constants';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@/components';
import type { AchievementCardProps } from '@/types';
import { cn, formatDate, getAchievementIcon } from '@/utils';
import { AchievementCardSkeleton } from './skeleton';

export const AchievementCard = memo(function AchievementCard({
	achievement,
	variant = AchievementCardVariant.DEFAULT,
	className,
	showUnlockedDate = false,
	isLoading = false,
}: AchievementCardProps) {
	if (isLoading || !achievement) {
		return <AchievementCardSkeleton variant={variant} className={className} />;
	}

	const IconComponent = getAchievementIcon(achievement);

	switch (variant) {
		case AchievementCardVariant.DETAILED:
			return (
				<Card className={cn('border-l-4 border-l-yellow-500', className)}>
					<CardHeader className='pb-3'>
						<CardTitle className='text-base flex items-center justify-between gap-2'>
							<div className='flex items-center gap-2'>
								<IconComponent className='h-4 w-4 text-yellow-500' />
								{achievement.name}
							</div>
							<Badge variant={VariantBase.SECONDARY} className='text-xs whitespace-nowrap'>
								{achievement.points} pts
							</Badge>
						</CardTitle>
					</CardHeader>
					<CardContent className='space-y-2'>
						<p className='text-sm text-muted-foreground'>{achievement.description}</p>
						<div className='flex items-center gap-2 flex-wrap'>
							<Badge variant={VariantBase.OUTLINE} className='text-xs'>
								{achievement.category}
							</Badge>
							{showUnlockedDate && achievement.unlockedAt && (
								<p className='text-xs text-muted-foreground'>Unlocked: {formatDate(achievement.unlockedAt)}</p>
							)}
						</div>
					</CardContent>
				</Card>
			);

		case AchievementCardVariant.COMPACT:
		case AchievementCardVariant.DEFAULT:
		default:
			return (
				<div className={cn('p-4 rounded-lg bg-primary/5 border border-primary/10 flex flex-col gap-3', className)}>
					<div className='flex items-start gap-3'>
						<div className='flex-shrink-0'>
							<IconComponent className='h-6 w-6 text-primary' />
						</div>
						<div className='flex-1 min-w-0'>
							<div className='flex items-start justify-between gap-2 mb-1'>
								<p className='font-semibold text-sm'>{achievement.name}</p>
								<Badge variant={VariantBase.SECONDARY} className='text-xs whitespace-nowrap'>
									{achievement.points} pts
								</Badge>
							</div>
							<p className='text-xs text-muted-foreground mb-2'>{achievement.description}</p>
							<Badge variant={VariantBase.OUTLINE} className='text-xs'>
								{achievement.category}
							</Badge>
						</div>
					</div>
				</div>
			);
	}
});
