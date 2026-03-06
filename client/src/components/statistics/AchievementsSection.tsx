import { memo } from 'react';

import { capitalize, sumBy } from '@shared/utils';

import { AchievementCardVariant } from '@/constants';
import { AchievementCard, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components';
import type { AchievementsSectionProps } from '@/types';

export const AchievementsSection = memo(function AchievementsSection({
	achievements,
	variant = AchievementCardVariant.COMPACT,
	showUnlockedDate = false,
	descriptionKind,
	headerActions,
	emptyMessage,
	emptyIcon: EmptyIcon,
	cardClassName,
	titleIcon: TitleIcon,
}: AchievementsSectionProps) {
	const totalPoints = sumBy(achievements, achievement => achievement.points);
	return (
		<Card className={cardClassName}>
			<CardHeader>
				<div className='flex items-center justify-between'>
					<div>
						<CardTitle className={TitleIcon ? 'flex items-center gap-2' : undefined}>
							{TitleIcon && <TitleIcon className='h-5 w-5 text-primary' />}
							Achievements
						</CardTitle>
						<CardDescription>
							{`${capitalize(descriptionKind)} achievements and milestones`} • Total Points:{' '}
							<span className='font-semibold text-primary'>{totalPoints}</span>
						</CardDescription>
					</div>
					{headerActions}
				</div>
			</CardHeader>
			<CardContent>
				{achievements.length > 0 ? (
					<div
						className={
							achievements.length <= 3
								? 'grid grid-cols-1 gap-4'
								: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
						}
					>
						{achievements.map(achievement => (
							<AchievementCard
								key={achievement.id}
								achievement={achievement}
								variant={variant}
								showUnlockedDate={showUnlockedDate}
							/>
						))}
					</div>
				) : (
					emptyMessage && (
						<div className='text-center py-8 text-muted-foreground'>
							{EmptyIcon && <EmptyIcon className='h-8 w-8 mx-auto mb-2 opacity-50' />}
							<p>{emptyMessage}</p>
						</div>
					)
				)}
			</CardContent>
		</Card>
	);
});
