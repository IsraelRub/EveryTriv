import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
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

import { ERROR_MESSAGES, TIME_DURATIONS_SECONDS, TIME_PERIODS_MS } from '@shared/constants';
import type { BusinessMetrics } from '@shared/types';
import { formatNumericValue } from '@shared/utils';

import {
	AdminKey,
	BusinessTabAccordion,
	QUERY_KEYS,
	SEMANTIC_ICON_TEXT,
	SKELETON_PLACEHOLDER_COUNTS,
	SkeletonVariant,
} from '@/constants';
import { analyticsService } from '@/services';
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
import { useUserRole } from '@/hooks';

export function BusinessTabContent() {
	const { t } = useTranslation('admin');
	const { isAdmin } = useUserRole();

	const { data: businessMetrics, isLoading: businessMetricsLoading } = useQuery<BusinessMetrics>({
		queryKey: QUERY_KEYS.admin.businessMetrics(),
		queryFn: async () => {
			if (!isAdmin) {
				throw new Error(ERROR_MESSAGES.validation.ADMIN_ACCESS_DENIED);
			}
			return analyticsService.getBusinessMetrics();
		},
		enabled: isAdmin,
		staleTime: TIME_PERIODS_MS.THIRTY_MINUTES,
		gcTime: TIME_PERIODS_MS.HOUR,
	});

	if (businessMetricsLoading) {
		return (
			<div className='grid grid-cols-2 lg:grid-cols-4 gap-6'>
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
				<div className='grid grid-cols-3 gap-4'>
					<StatCard
						icon={DollarSign}
						label={t(AdminKey.TOTAL_REVENUE)}
						value={formatNumericValue(businessMetrics.revenue.total, 2, undefined, '$')}
						color={SEMANTIC_ICON_TEXT.success}
					/>
					<StatCard
						icon={TrendingUp}
						label={t(AdminKey.MONTHLY_RECURRING_REVENUE)}
						value={formatNumericValue(businessMetrics.revenue.mrr, 2, undefined, '$')}
						color={SEMANTIC_ICON_TEXT.primary}
					/>
					<StatCard
						icon={Users}
						label={t(AdminKey.AVERAGE_REVENUE_PER_USER)}
						value={formatNumericValue(businessMetrics.revenue.arpu, 2, undefined, '$')}
						color={SEMANTIC_ICON_TEXT.secondary}
					/>
				</div>
			</SectionCard>

			<div className='grid grid-cols-2 gap-4'>
				<Accordion
					type='multiple'
					defaultValue={[BusinessTabAccordion.USER_METRICS, BusinessTabAccordion.ENGAGEMENT]}
					className='min-w-0 w-full rounded-lg border bg-card'
				>
					<AccordionItem value={BusinessTabAccordion.USER_METRICS}>
						<AccordionTrigger className='px-4'>
							<span className='flex items-center gap-2'>
								<Users className='h-4 w-4 shrink-0 text-primary' />
								{t(AdminKey.USER_METRICS)}
							</span>
						</AccordionTrigger>
						<AccordionContent className='px-4'>
							<div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
								<StatCard
									stackIconLabel
									icon={Users}
									label={t(AdminKey.TOTAL_USERS)}
									value={businessMetrics.users.total.toLocaleString()}
									color={SEMANTIC_ICON_TEXT.primary}
								/>
								<StatCard
									stackIconLabel
									icon={UserCheck}
									label={t(AdminKey.ACTIVE_USERS)}
									value={businessMetrics.users.active.toLocaleString()}
									color={SEMANTIC_ICON_TEXT.success}
								/>
								<StatCard
									stackIconLabel
									icon={TrendingUp}
									label={t(AdminKey.NEW_THIS_MONTH)}
									value={businessMetrics.users.newThisMonth.toLocaleString()}
									color={SEMANTIC_ICON_TEXT.secondary}
								/>
								<StatCard
									stackIconLabel
									icon={AlertTriangle}
									label={t(AdminKey.CHURN_RATE)}
									value={formatNumericValue(businessMetrics.users.churnRate, 2, '%')}
									color={SEMANTIC_ICON_TEXT.destructive}
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
							<div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
								<StatCard
									stackIconLabel
									icon={Activity}
									label={t(AdminKey.DAILY_ACTIVE_USERS)}
									value={businessMetrics.engagement.dau.toLocaleString()}
									color={SEMANTIC_ICON_TEXT.primary}
								/>
								<StatCard
									stackIconLabel
									icon={Users}
									label={t(AdminKey.WEEKLY_ACTIVE_USERS)}
									value={businessMetrics.engagement.wau.toLocaleString()}
									color={SEMANTIC_ICON_TEXT.success}
								/>
								<StatCard
									stackIconLabel
									icon={CalendarDays}
									label={t(AdminKey.MONTHLY_ACTIVE_USERS)}
									value={businessMetrics.engagement.mau.toLocaleString()}
									color={SEMANTIC_ICON_TEXT.secondary}
								/>
								<StatCard
									stackIconLabel
									icon={Timer}
									label={t(AdminKey.AVG_SESSION_DURATION)}
									value={formatNumericValue(
										businessMetrics.engagement.avgSessionDuration / TIME_DURATIONS_SECONDS.MINUTE,
										2,
										'm'
									)}
									color={SEMANTIC_ICON_TEXT.warning}
								/>
							</div>
							<p className='mt-2 text-sm text-muted-foreground'>{t(AdminKey.ENGAGEMENT_DESC)}</p>
						</AccordionContent>
					</AccordionItem>
				</Accordion>
				<Accordion
					type='multiple'
					defaultValue={[BusinessTabAccordion.PRICING]}
					className='min-w-0 w-full rounded-lg border bg-card'
				>
					<AccordionItem value={BusinessTabAccordion.PRICING}>
						<AccordionTrigger className='px-4'>{t(AdminKey.PRICING_CONFIG_TITLE)}</AccordionTrigger>
						<AccordionContent className='px-4'>
							<PricingConfigurationSection />
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			</div>
		</>
	);
}
