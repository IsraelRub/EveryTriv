import { memo } from 'react';
import { Flame } from 'lucide-react';

import { VariantBase } from '@/constants';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from '@/components';
import { usePopularTopics } from '@/hooks';

const TOPICS_TO_SHOW = 5;

export const PopularTopicsSection = memo(function PopularTopicsSection() {
	const { data: topicsData, isLoading } = usePopularTopics(undefined, { allowGuest: true });
	const topics = topicsData?.topics?.slice(0, TOPICS_TO_SHOW) ?? [];

	if (isLoading) {
		return (
			<Card className='border-muted bg-muted/20'>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Flame className='h-5 w-5 text-primary' />
						Popular Topics
					</CardTitle>
					<CardDescription>Most played topics across the platform</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='flex flex-wrap gap-2'>
						{[...Array(5)].map((_, i) => (
							<Skeleton key={i} className='h-8 w-20 rounded-full' />
						))}
					</div>
				</CardContent>
			</Card>
		);
	}

	if (topics.length === 0) {
		return null;
	}

	return (
		<Card className='border-muted bg-muted/20'>
			<CardHeader>
				<CardTitle className='flex items-center gap-2'>
					<Flame className='h-5 w-5 text-primary' />
					Popular Topics
				</CardTitle>
				<CardDescription>Most played topics across the platform</CardDescription>
			</CardHeader>
			<CardContent>
				<div className='flex flex-wrap gap-2'>
					{topics.map(t => (
						<Badge
							key={t.topic}
							variant={VariantBase.SECONDARY}
							className='px-3 py-1 text-sm font-medium cursor-default hover:bg-secondary hover:text-secondary-foreground'
							title={`${t.totalGames.toLocaleString()} games played`}
						>
							{t.topic}
							{topics.length <= 3 && (
								<span className='ml-1.5 text-muted-foreground font-normal'>
									({t.totalGames.toLocaleString()})
								</span>
							)}
						</Badge>
					))}
				</div>
			</CardContent>
		</Card>
	);
});
