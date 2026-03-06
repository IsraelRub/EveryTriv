import { memo } from 'react';
import { GraduationCap } from 'lucide-react';

import { formatDate } from '@shared/utils';

import { ACHIEVEMENT_DISPLAY, AchievementCardVariant, Colors, VariantBase } from '@/constants';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@/components';
import type { AchievementCardProps } from '@/types';
import { cn } from '@/utils';
import { AchievementCardSkeleton } from './skeleton';

export const AchievementCard = memo(function AchievementCard({
	achievement,
	variant = AchievementCardVariant.COMPACT,
	className,
	showUnlockedDate = false,
	isLoading = false,
}: AchievementCardProps) {
	if (isLoading || !achievement) {
		return <AchievementCardSkeleton variant={variant} className={className} />;
	}

	const IconComponent = ACHIEVEMENT_DISPLAY[achievement.id]?.Icon ?? GraduationCap;

	switch (variant) {
		case AchievementCardVariant.DETAILED:
			return (
				<Card className={cn('card-accent-left-warning', className)}>
					<CardHeader className='pb-3'>
						<CardTitle className='text-base flex items-center justify-between gap-2'>
							<div className='flex items-center gap-2'>
								<IconComponent className={cn('h-4 w-4', Colors.YELLOW_500.text)} />
								{achievement.name}
							</div>
							<Badge variant={VariantBase.STATIC} className='text-xs whitespace-nowrap'>
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
		default:
			return (
				<div className={cn('callout-primary', className)}>
					<div className='flex items-start gap-3'>
						<div className='flex-shrink-0'>
							<IconComponent className='h-6 w-6 text-primary' />
						</div>
						<div className='flex-1 min-w-0'>
							<div className='flex items-start justify-between gap-2 mb-1'>
								<p className='font-semibold text-sm'>{achievement.name}</p>
								<Badge variant={VariantBase.STATIC} className='text-xs whitespace-nowrap'>
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
