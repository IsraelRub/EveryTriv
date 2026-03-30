import { useTranslation } from 'react-i18next';
import {
	Activity,
	AlertTriangle,
	BriefcaseBusiness,
	CalendarDays,
	DollarSign,
	Timer,
	TrendingUp,
	UserCheck,
	Users,
} from 'lucide-react';

import { TIME_DURATIONS_SECONDS } from '@shared/constants';
import { formatNumericValue } from '@shared/utils';

import { AdminKey, BusinessTabAccordion, Colors, SKELETON_PLACEHOLDER_COUNTS, SkeletonVariant } from '@/constants';
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
	Card,
	CardContent,
	PricingConfigurationSection,
	SectionCard,
	Skeleton,
	StatCard,
} from '@/components';
import { useBusinessMetrics } from '@/hooks';

export function BusinessTabContent() {
	const { t } = useTranslation('admin');
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
					<BriefcaseBusiness className='h-12 w-12 mx-auto mb-4 opacity-50' />
					<p>{t(AdminKey.NO_BUSINESS_METRICS_AVAILABLE)}</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<>
			<SectionCard
				title={t(AdminKey.REVENUE_METRICS)}
				icon={BriefcaseBusiness}
				description={t(AdminKey.FINANCIAL_PERFORMANCE_DESC)}
			>
				<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
					<StatCard
						icon={DollarSign}
						label={t(AdminKey.TOTAL_REVENUE)}
						value={formatNumericValue(businessMetrics.revenue.total, 2, undefined, '$')}
						color={Colors.GREEN_500.text}
					/>
					<StatCard
						icon={TrendingUp}
						label={t(AdminKey.MONTHLY_RECURRING_REVENUE)}
						value={formatNumericValue(businessMetrics.revenue.mrr, 2, undefined, '$')}
						color={Colors.BLUE_500.text}
					/>
					<StatCard
						icon={Users}
						label={t(AdminKey.AVERAGE_REVENUE_PER_USER)}
						value={formatNumericValue(businessMetrics.revenue.arpu, 2, undefined, '$')}
						color={Colors.PURPLE_500.text}
					/>
				</div>
			</SectionCard>

			<Accordion
				type='multiple'
				defaultValue={[
					BusinessTabAccordion.USER_METRICS,
					BusinessTabAccordion.ENGAGEMENT,
					BusinessTabAccordion.PRICING,
				]}
				className='w-full rounded-lg border bg-card'
			>
				<AccordionItem value={BusinessTabAccordion.USER_METRICS}>
					<AccordionTrigger className='px-4'>
						<span className='flex items-center gap-2'>
							<Users className='h-4 w-4 shrink-0 text-primary' />
							{t(AdminKey.USER_METRICS)}
						</span>
					</AccordionTrigger>
					<AccordionContent className='px-4'>
						<div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
							<StatCard
								icon={Users}
								label={t(AdminKey.TOTAL_USERS)}
								value={businessMetrics.users.total.toLocaleString()}
								color={Colors.BLUE_500.text}
							/>
							<StatCard
								icon={UserCheck}
								label={t(AdminKey.ACTIVE_USERS)}
								value={businessMetrics.users.active.toLocaleString()}
								color={Colors.GREEN_500.text}
							/>
							<StatCard
								icon={TrendingUp}
								label={t(AdminKey.NEW_THIS_MONTH)}
								value={businessMetrics.users.newThisMonth.toLocaleString()}
								color={Colors.PURPLE_500.text}
							/>
							<StatCard
								icon={AlertTriangle}
								label={t(AdminKey.CHURN_RATE)}
								value={formatNumericValue(businessMetrics.users.churnRate, 2, '%')}
								color={Colors.RED_500.text}
							/>
						</div>
						<p className='mt-2 text-sm text-muted-foreground'>{t(AdminKey.USER_GROWTH_DESC)}</p>
					</AccordionContent>
				</AccordionItem>
				<AccordionItem value={BusinessTabAccordion.ENGAGEMENT}>
					<AccordionTrigger className='px-4'>
						<span className='flex items-center gap-2'>
							<Activity className='h-4 w-4 shrink-0 text-primary' />
							{t(AdminKey.ENGAGEMENT_METRICS)}
						</span>
					</AccordionTrigger>
					<AccordionContent className='px-4'>
						<div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
							<StatCard
								icon={Activity}
								label={t(AdminKey.DAILY_ACTIVE_USERS)}
								value={businessMetrics.engagement.dau.toLocaleString()}
								color={Colors.BLUE_500.text}
							/>
							<StatCard
								icon={Users}
								label={t(AdminKey.WEEKLY_ACTIVE_USERS)}
								value={businessMetrics.engagement.wau.toLocaleString()}
								color={Colors.GREEN_500.text}
							/>
							<StatCard
								icon={CalendarDays}
								label={t(AdminKey.MONTHLY_ACTIVE_USERS)}
								value={businessMetrics.engagement.mau.toLocaleString()}
								color={Colors.PURPLE_500.text}
							/>
							<StatCard
								icon={Timer}
								label={t(AdminKey.AVG_SESSION_DURATION)}
								value={formatNumericValue(
									businessMetrics.engagement.avgSessionDuration / TIME_DURATIONS_SECONDS.MINUTE,
									2,
									'm'
								)}
								color={Colors.YELLOW_500.text}
							/>
						</div>
						<p className='mt-2 text-sm text-muted-foreground'>{t(AdminKey.ENGAGEMENT_DESC)}</p>
					</AccordionContent>
				</AccordionItem>
				<AccordionItem value={BusinessTabAccordion.PRICING}>
					<AccordionTrigger className='px-4'>{t(AdminKey.PRICING_CONFIG_TITLE)}</AccordionTrigger>
					<AccordionContent className='px-4'>
						<PricingConfigurationSection />
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		</>
	);
}
