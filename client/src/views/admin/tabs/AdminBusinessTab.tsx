import {
	Activity,
	AlertTriangle,
	BarChart3,
	DollarSign,
	TrendingUp,
	Users,
} from 'lucide-react';

import { TIME_DURATIONS_SECONDS } from '@shared/constants';
import { formatForDisplay } from '@shared/utils';

import { SKELETON_WIDTHS, StatCardVariant, TextColor } from '@/constants';
import {
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
				{[...Array(4)].map((_, i) => (
					<Skeleton key={i} className={`h-32 ${SKELETON_WIDTHS.FULL}`} />
				))}
			</div>
		);
	}

	if (!businessMetrics) {
		return (
			<Card>
				<CardContent className='p-6 text-center text-muted-foreground'>
					<DollarSign className='h-12 w-12 mx-auto mb-4 opacity-50' />
					<p>No business metrics available</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<>
			<Card className='border-muted bg-muted/20'>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<DollarSign className='h-5 w-5' />
						Revenue Metrics
					</CardTitle>
					<CardDescription>Financial performance and revenue indicators</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
						<StatCard
							icon={DollarSign}
							label='Total Revenue'
							value={`$${formatForDisplay(businessMetrics.revenue.total)}`}
							color={TextColor.GREEN_500}
							variant={StatCardVariant.VERTICAL}
						/>
						<StatCard
							icon={TrendingUp}
							label='Monthly Recurring Revenue (MRR)'
							value={`$${formatForDisplay(businessMetrics.revenue.mrr)}`}
							color={TextColor.BLUE_500}
							variant={StatCardVariant.VERTICAL}
						/>
						<StatCard
							icon={Users}
							label='Average Revenue Per User (ARPU)'
							value={`$${formatForDisplay(businessMetrics.revenue.arpu)}`}
							color={TextColor.PURPLE_500}
							variant={StatCardVariant.VERTICAL}
						/>
					</div>
				</CardContent>
			</Card>

			<Card className='border-muted bg-muted/20'>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Users className='h-5 w-5' />
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
							color={TextColor.BLUE_500}
							variant={StatCardVariant.VERTICAL}
						/>
						<StatCard
							icon={Activity}
							label='Active Users'
							value={businessMetrics.users.active.toLocaleString()}
							color={TextColor.GREEN_500}
							variant={StatCardVariant.VERTICAL}
						/>
						<StatCard
							icon={TrendingUp}
							label='New This Month'
							value={businessMetrics.users.newThisMonth.toLocaleString()}
							color={TextColor.PURPLE_500}
							variant={StatCardVariant.VERTICAL}
						/>
						<StatCard
							icon={AlertTriangle}
							label='Churn Rate'
							value={`${formatForDisplay(businessMetrics.users.churnRate)}%`}
							color={TextColor.RED_500}
							variant={StatCardVariant.VERTICAL}
						/>
					</div>
				</CardContent>
			</Card>

			<Card className='border-muted bg-muted/20'>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Activity className='h-5 w-5' />
						Engagement Metrics
					</CardTitle>
					<CardDescription>User engagement and activity indicators</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
						<StatCard
							icon={Users}
							label='Daily Active Users (DAU)'
							value={businessMetrics.engagement.dau.toLocaleString()}
							color={TextColor.BLUE_500}
							variant={StatCardVariant.VERTICAL}
						/>
						<StatCard
							icon={Users}
							label='Weekly Active Users (WAU)'
							value={businessMetrics.engagement.wau.toLocaleString()}
							color={TextColor.GREEN_500}
							variant={StatCardVariant.VERTICAL}
						/>
						<StatCard
							icon={Users}
							label='Monthly Active Users (MAU)'
							value={businessMetrics.engagement.mau.toLocaleString()}
							color={TextColor.PURPLE_500}
							variant={StatCardVariant.VERTICAL}
						/>
						<StatCard
							icon={BarChart3}
							label='Avg Session Duration'
							value={`${formatForDisplay(businessMetrics.engagement.avgSessionDuration / TIME_DURATIONS_SECONDS.MINUTE)}m`}
							color={TextColor.YELLOW_500}
							variant={StatCardVariant.VERTICAL}
						/>
					</div>
				</CardContent>
			</Card>
		</>
	);
}
