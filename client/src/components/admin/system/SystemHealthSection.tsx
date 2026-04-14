import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
	Activity,
	AlertTriangle,
	CheckCircle,
	CircleGauge,
	Clock,
	Cpu,
	Database,
	HardDrive,
	KeyRound,
	Layers,
	Layers2,
	Lightbulb,
	LogIn,
	ScanEye,
	Shield,
	TrendingUp,
	Zap,
} from 'lucide-react';

import {
	ERROR_MESSAGES,
	RecommendationPriority,
	SYSTEM_HEALTH_THRESHOLDS,
	SystemInsightStatus,
	TIME_DURATIONS_SECONDS,
	TIME_PERIODS_MS,
} from '@shared/constants';
import type { SecurityMetrics, SystemInsights, SystemPerformanceMetrics, SystemRecommendation } from '@shared/types';
import { formatNumericValue } from '@shared/utils';

import {
	AdminKey,
	QUERY_KEYS,
	SEMANTIC_ICON_TEXT,
	SkeletonVariant,
	SystemInsightAccordion,
	SystemSecurityAccordion,
	VariantBase,
} from '@/constants';
import type { AdminSystemHealthDashboardBundle } from '@/types';
import { analyticsService } from '@/services';
import { formatDateTime } from '@/utils';
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
	Badge,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	SectionCard,
	Skeleton,
	StatCard,
} from '@/components';
import { useUserRole } from '@/hooks';

type OverallSystemStatus = 'healthy' | 'attention' | 'critical';

function deriveOverallSystemStatus(
	performance: SystemPerformanceMetrics | undefined,
	security: SecurityMetrics | undefined,
	insights: SystemInsights | undefined,
	recommendations: SystemRecommendation[] | undefined
): OverallSystemStatus {
	if (recommendations?.some(r => r.priority === RecommendationPriority.HIGH)) {
		return 'critical';
	}
	if (performance != null && performance.errorRate > SYSTEM_HEALTH_THRESHOLDS.ERROR_RATE_ATTENTION_PERCENT) {
		return 'critical';
	}
	if (security != null && security.dataSecurity.dataBreaches > 0) {
		return 'critical';
	}
	if (insights?.status === SystemInsightStatus.ATTENTION) {
		return 'attention';
	}
	if (
		security != null &&
		security.authentication.failedLogins > SYSTEM_HEALTH_THRESHOLDS.FAILED_LOGINS_ATTENTION_COUNT
	) {
		return 'attention';
	}
	if (recommendations?.some(r => r.priority === RecommendationPriority.MEDIUM)) {
		return 'attention';
	}
	return 'healthy';
}

export function SystemHealthSection() {
	const { t } = useTranslation();
	const { isAdmin } = useUserRole();

	const {
		data: bundle,
		isPending,
		isError,
	} = useQuery<AdminSystemHealthDashboardBundle>({
		queryKey: QUERY_KEYS.admin.systemHealthDashboard(),
		queryFn: async () => {
			if (!isAdmin) {
				throw new Error(ERROR_MESSAGES.validation.ADMIN_ACCESS_DENIED);
			}
			return analyticsService.getAdminSystemHealthDashboard();
		},
		enabled: isAdmin,
		staleTime: TIME_PERIODS_MS.TWO_MINUTES,
		gcTime: TIME_PERIODS_MS.FIVE_MINUTES,
		refetchInterval: TIME_PERIODS_MS.FIVE_MINUTES,
	});

	const systemPerformance = bundle?.performance;
	const systemSecurity = bundle?.security;
	const systemRecommendations = bundle?.recommendations;
	const systemInsights = bundle?.insights;

	const overallStatus = useMemo(
		() => deriveOverallSystemStatus(systemPerformance, systemSecurity, systemInsights, systemRecommendations),
		[systemPerformance, systemSecurity, systemInsights, systemRecommendations]
	);

	const systemInsightsAccordionDefault = useMemo((): SystemInsightAccordion[] => {
		if (systemInsights == null) return [];
		const v: SystemInsightAccordion[] = [];
		if (systemInsights.performanceInsights.length > 0) v.push(SystemInsightAccordion.PERF);
		if (systemInsights.securityInsights.length > 0) v.push(SystemInsightAccordion.SEC);
		if (systemInsights.userBehaviorInsights.length > 0) v.push(SystemInsightAccordion.USER);
		if (systemInsights.systemHealthInsights.length > 0) v.push(SystemInsightAccordion.HEALTH);
		if (systemInsights.trends.length > 0) v.push(SystemInsightAccordion.TRENDS);
		return v;
	}, [systemInsights]);

	const overallLabelKey: AdminKey =
		overallStatus === 'healthy'
			? AdminKey.OVERALL_STATUS_HEALTHY
			: overallStatus === 'attention'
				? AdminKey.OVERALL_STATUS_ATTENTION
				: AdminKey.OVERALL_STATUS_CRITICAL;

	const overallCardClass =
		overallStatus === 'healthy'
			? 'border-emerald-500/40 bg-emerald-500/5'
			: overallStatus === 'attention'
				? 'border-amber-500/50 bg-amber-500/5'
				: 'border-destructive/60 bg-destructive/5';

	if (isPending) {
		return (
			<div className='space-y-6'>
				<Skeleton variant={SkeletonVariant.BlockTall} className='h-24 w-full rounded-lg' />
				<Skeleton variant={SkeletonVariant.BlockTall} className='h-64 w-full rounded-lg' />
				<Skeleton variant={SkeletonVariant.BlockTall} className='h-64 w-full rounded-lg' />
			</div>
		);
	}

	if (isError || bundle == null) {
		return (
			<div className='rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-center text-sm text-destructive'>
				{t(AdminKey.FAILED_TO_LOAD_USERS)}
			</div>
		);
	}

	return (
		<div className='space-y-8'>
			<Card className={overallCardClass}>
				<CardHeader className='pb-2'>
					<CardTitle className='text-base font-semibold'>{t(AdminKey.SYSTEM_HEALTH_AT_A_GLANCE)}</CardTitle>
					<CardDescription className='flex flex-wrap items-center gap-3 pt-2'>
						<span
							className={
								overallStatus === 'healthy'
									? 'inline-flex h-3 w-3 rounded-full bg-emerald-500'
									: overallStatus === 'attention'
										? 'inline-flex h-3 w-3 rounded-full bg-amber-500'
										: 'inline-flex h-3 w-3 rounded-full bg-destructive'
							}
							aria-hidden
						/>
						<span className='text-foreground text-lg font-medium'>{t(overallLabelKey)}</span>
					</CardDescription>
				</CardHeader>
			</Card>

			<SectionCard
				title={t(AdminKey.PERFORMANCE_METRICS)}
				icon={Layers}
				description={t(AdminKey.PERFORMANCE_METRICS_DESC)}
			>
				{systemPerformance ? (
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
						<StatCard
							icon={Zap}
							label={t(AdminKey.RESPONSE_TIME)}
							value={formatNumericValue(systemPerformance.responseTime, 2, 'ms')}
							color={SEMANTIC_ICON_TEXT.primary}
						/>
						<StatCard
							icon={HardDrive}
							label={t(AdminKey.MEMORY_USAGE)}
							value={formatNumericValue(systemPerformance.memoryUsage / 1024 / 1024, 2, ' MB')}
							color={SEMANTIC_ICON_TEXT.secondary}
						/>
						<StatCard
							icon={Cpu}
							label={t(AdminKey.CPU_USAGE)}
							value={formatNumericValue(systemPerformance.cpuUsage, 2, '%')}
							color={SEMANTIC_ICON_TEXT.warning}
						/>
						<StatCard
							icon={CircleGauge}
							label={t(AdminKey.THROUGHPUT)}
							value={formatNumericValue(systemPerformance.throughput, 2, ' req/s')}
							color={SEMANTIC_ICON_TEXT.success}
						/>
						<StatCard
							icon={AlertTriangle}
							label={t(AdminKey.ERROR_RATE)}
							value={formatNumericValue(systemPerformance.errorRate, 2, '%')}
							color={
								systemPerformance.errorRate > SYSTEM_HEALTH_THRESHOLDS.ERROR_RATE_ATTENTION_PERCENT
									? SEMANTIC_ICON_TEXT.destructive
									: SEMANTIC_ICON_TEXT.success
							}
						/>
						<StatCard
							icon={Clock}
							label={t(AdminKey.UPTIME)}
							value={formatNumericValue(systemPerformance.uptime / TIME_DURATIONS_SECONDS.HOUR, 2, 'h')}
							color={SEMANTIC_ICON_TEXT.primary}
						/>
					</div>
				) : (
					<div className='text-center py-8 text-muted-foreground'>
						<Zap className='h-12 w-12 mx-auto mb-4 opacity-50' />
						<p>{t(AdminKey.NO_PERFORMANCE_METRICS_AVAILABLE)}</p>
					</div>
				)}
			</SectionCard>

			<SectionCard title={t(AdminKey.SECURITY_METRICS)} icon={Layers2} description={t(AdminKey.SECURITY_METRICS_DESC)}>
				{systemSecurity ? (
					<Accordion
						type='multiple'
						defaultValue={[SystemSecurityAccordion.AUTH, SystemSecurityAccordion.AUTHZ, SystemSecurityAccordion.DATA]}
						className='w-full'
					>
						<AccordionItem value={SystemSecurityAccordion.AUTH}>
							<AccordionTrigger>
								<span className='flex items-center gap-2'>
									<LogIn className='h-5 w-5 shrink-0 text-primary' />
									{t(AdminKey.AUTHENTICATION)}
								</span>
							</AccordionTrigger>
							<AccordionContent>
								<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
									<StatCard
										icon={AlertTriangle}
										label={t(AdminKey.FAILED_LOGINS)}
										value={systemSecurity.authentication.failedLogins.toLocaleString()}
										color={SEMANTIC_ICON_TEXT.destructive}
									/>
									<StatCard
										icon={CheckCircle}
										label={t(AdminKey.SUCCESSFUL_LOGINS)}
										value={systemSecurity.authentication.successfulLogins.toLocaleString()}
										color={SEMANTIC_ICON_TEXT.success}
									/>
									<StatCard
										icon={Shield}
										label={t(AdminKey.ACCOUNT_LOCKOUTS)}
										value={systemSecurity.authentication.accountLockouts.toLocaleString()}
										color={SEMANTIC_ICON_TEXT.warning}
									/>
								</div>
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value={SystemSecurityAccordion.AUTHZ}>
							<AccordionTrigger>
								<span className='flex items-center gap-2'>
									<KeyRound className='h-5 w-5 shrink-0 text-primary' />
									{t(AdminKey.AUTHORIZATION)}
								</span>
							</AccordionTrigger>
							<AccordionContent>
								<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
									<StatCard
										icon={AlertTriangle}
										label={t(AdminKey.UNAUTHORIZED_ATTEMPTS)}
										value={systemSecurity.authorization.unauthorizedAttempts.toLocaleString()}
										color={SEMANTIC_ICON_TEXT.destructive}
									/>
									<StatCard
										icon={Shield}
										label={t(AdminKey.PERMISSION_VIOLATIONS)}
										value={systemSecurity.authorization.permissionViolations.toLocaleString()}
										color={SEMANTIC_ICON_TEXT.orange}
									/>
								</div>
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value={SystemSecurityAccordion.DATA}>
							<AccordionTrigger>
								<span className='flex items-center gap-2'>
									<Database className='h-5 w-5 shrink-0 text-primary' />
									{t(AdminKey.DATA_SECURITY)}
								</span>
							</AccordionTrigger>
							<AccordionContent>
								<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
									<StatCard
										icon={AlertTriangle}
										label={t(AdminKey.DATA_BREACHES)}
										value={systemSecurity.dataSecurity.dataBreaches.toLocaleString()}
										color={
											systemSecurity.dataSecurity.dataBreaches > 0
												? SEMANTIC_ICON_TEXT.destructive
												: SEMANTIC_ICON_TEXT.success
										}
									/>
									<StatCard
										icon={Shield}
										label={t(AdminKey.ENCRYPTION_COVERAGE)}
										value={formatNumericValue(systemSecurity.dataSecurity.encryptionCoverage, 2, '%')}
										color={SEMANTIC_ICON_TEXT.primary}
									/>
									<StatCard
										icon={CheckCircle}
										label={t(AdminKey.BACKUP_SUCCESS_RATE)}
										value={formatNumericValue(systemSecurity.dataSecurity.backupSuccessRate, 2, '%')}
										color={SEMANTIC_ICON_TEXT.success}
									/>
								</div>
							</AccordionContent>
						</AccordionItem>
					</Accordion>
				) : (
					<div className='text-center py-8 text-muted-foreground'>
						<Shield className='h-12 w-12 mx-auto mb-4 opacity-50' />
						<p>{t(AdminKey.NO_SECURITY_METRICS_AVAILABLE)}</p>
					</div>
				)}
			</SectionCard>

			{systemRecommendations != null && systemRecommendations.length > 0 && (
				<Accordion
					type='multiple'
					defaultValue={['system-recommendations']}
					className='w-full rounded-lg border bg-card'
				>
					<AccordionItem value='system-recommendations'>
						<AccordionTrigger className='px-4'>
							<span className='flex items-center gap-2'>
								<Lightbulb className='h-4 w-4 shrink-0 text-primary' />
								{t(AdminKey.SYSTEM_RECOMMENDATIONS)}
							</span>
						</AccordionTrigger>
						<AccordionContent className='px-4 pb-4'>
							<p className='mb-4 text-sm text-muted-foreground'>{t(AdminKey.SECURITY_RECOMMENDATIONS_DESC)}</p>
							<div className='space-y-4'>
								{systemRecommendations.map(recommendation => (
									<Card key={recommendation.id} className='card-accent-left-warning'>
										<CardHeader className='pb-3'>
											<div className='flex items-start justify-between'>
												<div className='flex-1'>
													<CardTitle className='mb-1 text-lg'>{recommendation.title}</CardTitle>
													<CardDescription>{recommendation.description}</CardDescription>
												</div>
												<Badge
													variant={
														recommendation.priority === RecommendationPriority.HIGH
															? VariantBase.DESTRUCTIVE
															: VariantBase.SECONDARY
													}
												>
													{recommendation.priority}
												</Badge>
											</div>
										</CardHeader>
										<CardContent>
											<div className='space-y-2'>
												<p className='text-sm'>{recommendation.message}</p>
												<div className='flex flex-wrap gap-4 text-xs text-muted-foreground'>
													<span>
														<strong>{t(AdminKey.RECOMMENDATION_ACTION)}:</strong> {recommendation.action}
													</span>
													<span>
														<strong>{t(AdminKey.RECOMMENDATION_IMPACT)}:</strong> {recommendation.estimatedImpact}
													</span>
													<span>
														<strong>{t(AdminKey.RECOMMENDATION_EFFORT)}:</strong> {recommendation.implementationEffort}
													</span>
												</div>
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			)}

			{systemInsights != null && (
				<SectionCard title={t(AdminKey.SYSTEM_INSIGHTS)} icon={ScanEye} description={t(AdminKey.SYSTEM_INSIGHTS_DESC)}>
					<div className='space-y-6'>
						<div className='mb-4 flex items-center gap-2'>
							<Badge
								variant={
									systemInsights.status === SystemInsightStatus.OPTIMAL
										? VariantBase.DEFAULT
										: systemInsights.status === SystemInsightStatus.ATTENTION
											? VariantBase.SECONDARY
											: VariantBase.DESTRUCTIVE
								}
							>
								{systemInsights.status.toUpperCase()}
							</Badge>
							<span className='text-sm text-muted-foreground'>
								{t(AdminKey.LAST_UPDATED)} {formatDateTime(systemInsights.timestamp)}
							</span>
						</div>

						{systemInsightsAccordionDefault.length === 0 ? (
							<div className='py-6 text-center text-muted-foreground'>
								<ScanEye className='mx-auto mb-4 h-12 w-12 opacity-50' />
								<p>{t(AdminKey.NO_SYSTEM_INSIGHTS_AVAILABLE)}</p>
							</div>
						) : (
							<Accordion type='multiple' defaultValue={systemInsightsAccordionDefault} className='w-full'>
								{systemInsights.performanceInsights.length > 0 ? (
									<AccordionItem value={SystemInsightAccordion.PERF}>
										<AccordionTrigger>
											<span className='flex items-center gap-2'>
												<Zap className='h-5 w-5 shrink-0 text-primary' />
												{t(AdminKey.SYSTEM_INSIGHTS_CATEGORY_PERFORMANCE)}
											</span>
										</AccordionTrigger>
										<AccordionContent>
											<div className='space-y-3'>
												{systemInsights.performanceInsights.map((insight, index) => (
													<div key={index} className='rounded-lg bg-muted/50 p-3'>
														<span className='text-sm'>{insight}</span>
													</div>
												))}
											</div>
										</AccordionContent>
									</AccordionItem>
								) : null}
								{systemInsights.securityInsights.length > 0 ? (
									<AccordionItem value={SystemInsightAccordion.SEC}>
										<AccordionTrigger>
											<span className='flex items-center gap-2'>
												<Shield className='h-5 w-5 shrink-0 text-primary' />
												{t(AdminKey.SYSTEM_INSIGHTS_CATEGORY_SECURITY)}
											</span>
										</AccordionTrigger>
										<AccordionContent>
											<div className='space-y-3'>
												{systemInsights.securityInsights.map((insight, index) => (
													<div key={index} className='rounded-lg bg-muted/50 p-3'>
														<span className='text-sm'>{insight}</span>
													</div>
												))}
											</div>
										</AccordionContent>
									</AccordionItem>
								) : null}
								{systemInsights.userBehaviorInsights.length > 0 ? (
									<AccordionItem value={SystemInsightAccordion.USER}>
										<AccordionTrigger>
											<span className='flex items-center gap-2'>
												<Activity className='h-5 w-5 shrink-0 text-primary' />
												{t(AdminKey.SYSTEM_INSIGHTS_CATEGORY_USER_BEHAVIOR)}
											</span>
										</AccordionTrigger>
										<AccordionContent>
											<div className='space-y-3'>
												{systemInsights.userBehaviorInsights.map((insight, index) => (
													<div key={index} className='rounded-lg bg-muted/50 p-3'>
														<span className='text-sm'>{insight}</span>
													</div>
												))}
											</div>
										</AccordionContent>
									</AccordionItem>
								) : null}
								{systemInsights.systemHealthInsights.length > 0 ? (
									<AccordionItem value={SystemInsightAccordion.HEALTH}>
										<AccordionTrigger>
											<span className='flex items-center gap-2'>
												<Activity className='h-5 w-5 shrink-0 text-primary' />
												{t(AdminKey.SYSTEM_INSIGHTS_CATEGORY_SYSTEM_HEALTH)}
											</span>
										</AccordionTrigger>
										<AccordionContent>
											<div className='space-y-3'>
												{systemInsights.systemHealthInsights.map((insight, index) => (
													<div key={index} className='rounded-lg bg-muted/50 p-3'>
														<span className='text-sm'>{insight}</span>
													</div>
												))}
											</div>
										</AccordionContent>
									</AccordionItem>
								) : null}
								{systemInsights.trends.length > 0 ? (
									<AccordionItem value={SystemInsightAccordion.TRENDS}>
										<AccordionTrigger>
											<span className='flex items-center gap-2'>
												<TrendingUp className='h-5 w-5 shrink-0 text-primary' />
												{t(AdminKey.SYSTEM_INSIGHTS_CATEGORY_TRENDS)}
											</span>
										</AccordionTrigger>
										<AccordionContent>
											<div className='space-y-3'>
												{systemInsights.trends.map((trend, index) => (
													<div key={index} className='rounded-lg bg-muted/50 p-3'>
														<span className='text-sm'>{trend}</span>
													</div>
												))}
											</div>
										</AccordionContent>
									</AccordionItem>
								) : null}
							</Accordion>
						)}
					</div>
				</SectionCard>
			)}
		</div>
	);
}
