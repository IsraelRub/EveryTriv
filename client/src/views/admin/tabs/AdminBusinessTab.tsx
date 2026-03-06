import { Activity, CalendarDays, DollarSign, Timer, TrendingUp, UserCheck, Users } from 'lucide-react';

import { TIME_DURATIONS_SECONDS } from '@shared/constants';
import { formatNumericValue } from '@shared/utils';

import { Colors, SKELETON_PLACEHOLDER_COUNTS, SkeletonVariant } from '@/constants';
import {
	AlertIconSource,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Skeleton,
	StatCard,
} from '@/components';
import { useBusinessMetrics } from '@/hooks';

export function AdminBusinessTab() {
	const { data: businessMetrics, isLoading: businessMetricsLoading } = useBusinessMetrics();

	if (businessMetricsLoading) {
		return (
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
				<Skeleton variant={SkeletonVariant.BlockTall} count={SKELETON_PLACEHOLDER_COUNTS.CARDS} />
			</div>
		);
	}

	if (!businessMetrics) {
		return (
			<Card>
				<CardContent className='card-content-center-muted'>
					<DollarSign className='h-12 w-12 mx-auto mb-4 opacity-50' />
					<p>No business metrics available</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<>
			<Card className='card-muted-tint'>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<DollarSign className='h-5 w-5 text-primary' />
						Revenue Metrics
					</CardTitle>
					<CardDescription>Financial performance and revenue indicators</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
						<StatCard
							icon={DollarSign}
							label='Total Revenue'
							value={formatNumericValue(businessMetrics.revenue.total, 2, undefined, '$')}
							color={Colors.GREEN_500.text}
						/>
						<StatCard
							icon={TrendingUp}
							label='Monthly Recurring Revenue (MRR)'
							value={formatNumericValue(businessMetrics.revenue.mrr, 2, undefined, '$')}
							color={Colors.BLUE_500.text}
						/>
						<StatCard
							icon={Users}
							label='Average Revenue Per User (ARPU)'
							value={formatNumericValue(businessMetrics.revenue.arpu, 2, undefined, '$')}
							color={Colors.PURPLE_500.text}
						/>
					</div>
				</CardContent>
			</Card>

			<Card className='card-muted-tint'>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Users className='h-5 w-5 text-primary' />
						User Metrics
					</CardTitle>
					<CardDescription>User growth and retention metrics</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
						<StatCard
							icon={Users}
							label='Total Users'
							value={businessMetrics.users.total.toLocaleString()}
							color={Colors.BLUE_500.text}
						/>
						<StatCard
							icon={UserCheck}
							label='Active Users'
							value={businessMetrics.users.active.toLocaleString()}
							color={Colors.GREEN_500.text}
						/>
						<StatCard
							icon={TrendingUp}
							label='New This Month'
							value={businessMetrics.users.newThisMonth.toLocaleString()}
							color={Colors.PURPLE_500.text}
						/>
						<StatCard
							icon={AlertIconSource}
							label='Churn Rate'
							value={formatNumericValue(businessMetrics.users.churnRate, 2, '%')}
							color={Colors.RED_500.text}
						/>
					</div>
				</CardContent>
			</Card>

			<Card className='card-muted-tint'>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Activity className='h-5 w-5 text-primary' />
						Engagement Metrics
					</CardTitle>
					<CardDescription>User engagement and activity indicators</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
						<StatCard
							icon={Activity}
							label='Daily Active Users (DAU)'
							value={businessMetrics.engagement.dau.toLocaleString()}
							color={Colors.BLUE_500.text}
						/>
						<StatCard
							icon={Users}
							label='Weekly Active Users (WAU)'
							value={businessMetrics.engagement.wau.toLocaleString()}
							color={Colors.GREEN_500.text}
						/>
						<StatCard
							icon={CalendarDays}
							label='Monthly Active Users (MAU)'
							value={businessMetrics.engagement.mau.toLocaleString()}
							color={Colors.PURPLE_500.text}
						/>
						<StatCard
							icon={Timer}
							label='Avg Session Duration'
							value={formatNumericValue(
								businessMetrics.engagement.avgSessionDuration / TIME_DURATIONS_SECONDS.MINUTE,
								2,
								'm'
							)}
							color={Colors.YELLOW_500.text}
						/>
					</div>
				</CardContent>
			</Card>
		</>
	);
}
