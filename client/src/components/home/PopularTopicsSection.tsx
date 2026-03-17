import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flame } from 'lucide-react';

import { formatTitle } from '@shared/utils';

import {
	HomeKey,
	POPULAR_TOPICS_TO_SHOW,
	SKELETON_PLACEHOLDER_COUNTS,
	SkeletonVariant,
	VariantBase,
} from '@/constants';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from '@/components';
import { usePopularTopics } from '@/hooks';

export const PopularTopicsSection = memo(function PopularTopicsSection() {
	const { t } = useTranslation('home');
	const { data: topicsData, isLoading } = usePopularTopics(undefined, { allowGuest: true });
	const topics = topicsData?.topics?.slice(0, POPULAR_TOPICS_TO_SHOW) ?? [];

	if (!isLoading && topics.length === 0) {
		return null;
	}

	return (
		<Card className='card-muted-tint h-full flex flex-col min-w-0'>
			<CardHeader>
				<CardTitle className='text-xl flex items-center gap-2'>
					<Flame className='h-5 w-5 text-primary' />
					{t(HomeKey.POPULAR_TOPICS_TITLE)}
				</CardTitle>
				<CardDescription>{t(HomeKey.POPULAR_TOPICS_DESC)}</CardDescription>
			</CardHeader>
			<CardContent className='flex-1'>
				{isLoading ? (
					<div className='flex flex-col gap-2'>
						<Skeleton
							variant={SkeletonVariant.IconNarrow}
							count={SKELETON_PLACEHOLDER_COUNTS.LIST}
							className='rounded-full'
						/>
					</div>
				) : (
					<div className='flex flex-col gap-2 items-start'>
						{topics.map(topicItem => (
							<Badge
								key={topicItem.topic}
								variant={VariantBase.SECONDARY}
								className='px-3 py-1 text-sm font-medium'
								title={t(HomeKey.GAMES_PLAYED_TOOLTIP, { count: topicItem.totalGames })}
							>
								{formatTitle(topicItem.topic)}
								{topics.length <= 3 && (
									<span className='ms-1.5 text-muted-foreground font-normal'>
										({topicItem.totalGames.toLocaleString()})
									</span>
								)}
							</Badge>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
});
