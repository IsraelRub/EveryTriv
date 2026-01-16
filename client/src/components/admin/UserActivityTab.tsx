import { Activity } from 'lucide-react';

import { VariantBase } from '@/constants';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from '@/components';
import { useUserActivityById } from '@/hooks';
import type { UserActivityTabProps } from '@/types';
import { formatPlayTime } from '@/utils';

export function UserActivityTab({ activeUserId }: UserActivityTabProps) {
	const { data: userActivity, isLoading: activityLoading } = useUserActivityById(
		activeUserId,
		50,
		undefined,
		undefined,
		true
	);

	if (activityLoading) {
		return (
			<div className='space-y-4'>
				{[...Array(5)].map((_, i) => (
					<Skeleton key={i} className='h-16 w-full' />
				))}
			</div>
		);
	}

	if (!userActivity?.data || userActivity.data.length === 0) {
		return (
			<Card>
				<CardContent className='p-6 text-center text-muted-foreground'>
					<Activity className='h-12 w-12 mx-auto mb-4 opacity-50' />
					<p>No activity data available</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Recent Activity</CardTitle>
				<CardDescription>User activity timeline</CardDescription>
			</CardHeader>
			<CardContent>
				<div className='space-y-3'>
					{userActivity.data.slice(0, 50).map((activity, index) => (
						<div key={index} className='flex items-start gap-3 p-3 border rounded-lg'>
							<Activity className='h-4 w-4 mt-1 text-muted-foreground' />
							<div className='flex-1'>
								<div className='flex items-center justify-between'>
									<span className='font-medium'>{activity.action}</span>
									<span className='text-sm text-muted-foreground'>{new Date(activity.date).toLocaleString()}</span>
								</div>
								{activity.detail && <p className='text-sm text-muted-foreground mt-1'>{activity.detail}</p>}
								{activity.topic && (
									<Badge variant={VariantBase.SECONDARY} className='mt-2'>
										{activity.topic}
									</Badge>
								)}
								{activity.durationSeconds && (
									<span className='text-xs text-muted-foreground ml-2'>
										{formatPlayTime(activity.durationSeconds, 'seconds')}
									</span>
								)}
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
