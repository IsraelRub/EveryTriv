import { memo } from 'react';
import { Flame } from 'lucide-react';

import { formatTitle } from '@shared/utils';

import { SKELETON_PLACEHOLDER_COUNTS, SkeletonVariant, VariantBase } from '@/constants';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from '@/components';
import { usePopularTopics } from '@/hooks';

const TOPICS_TO_SHOW = 5;

export const PopularTopicsSection = memo(function PopularTopicsSection() {
	const { data: topicsData, isLoading } = usePopularTopics(undefined, { allowGuest: true });
	const topics = topicsData?.topics?.slice(0, TOPICS_TO_SHOW) ?? [];

	if (!isLoading && topics.length === 0) {
		return null;
	}

	return (
		<Card className='card-muted-tint h-full flex flex-col min-w-0'>
			<CardHeader>
				<CardTitle className='text-xl flex items-center gap-2'>
					<Flame className='h-5 w-5 text-primary' />
					Popular Topics
				</CardTitle>
				<CardDescription>Most played topics</CardDescription>
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
						{topics.map(t => (
							<Badge
								key={t.topic}
								variant={VariantBase.STATIC}
								className='px-3 py-1 text-sm font-medium'
								title={`${t.totalGames.toLocaleString()} games played`}
							>
								{formatTitle(t.topic)}
								{topics.length <= 3 && (
									<span className='ml-1.5 text-muted-foreground font-normal'>({t.totalGames.toLocaleString()})</span>
								)}
							</Badge>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
});
