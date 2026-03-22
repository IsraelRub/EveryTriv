import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
	RecommendationPriority,
	SYSTEM_HEALTH_THRESHOLDS,
	SystemInsightStatus,
	TIME_DURATIONS_SECONDS,
} from '@shared/constants';
import { formatNumericValue } from '@shared/utils';

import { AdminKey, Colors, SKELETON_PLACEHOLDER_COUNTS, SkeletonVariant, VariantBase } from '@/constants';
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
import {
	useSystemInsights,
	useSystemPerformanceMetrics,
	useSystemRecommendations,
	useSystemSecurityMetrics,
} from '@/hooks';

const SECURITY_ACCORDION = {
	AUTH: 'security-auth',
	AUTHZ: 'security-authz',
	DATA: 'security-data',
} as const;

const SYSTEM_INSIGHT_ACCORDION = {
	PERF: 'si-perf',
	SEC: 'si-sec',
	USER: 'si-user',
	HEALTH: 'si-health',
	TRENDS: 'si-trends',
} as const;

export function SystemHealthSection() {
	const { t } = useTranslation();
	const { data: systemPerformance, isLoading: systemPerformanceLoading } = useSystemPerformanceMetrics();
	const { data: systemSecurity, isLoading: systemSecurityLoading } = useSystemSecurityMetrics();
	const { data: systemRecommendations, isLoading: systemRecommendationsLoading } = useSystemRecommendations();
	const { data: systemInsights, isLoading: systemInsightsLoading } = useSystemInsights();

	const systemInsightsAccordionDefault = useMemo((): string[] => {
		if (systemInsights == null) return [];
		const v: string[] = [];
		if (systemInsights.performanceInsights.length > 0) v.push(SYSTEM_INSIGHT_ACCORDION.PERF);
		if (systemInsights.securityInsights.length > 0) v.push(SYSTEM_INSIGHT_ACCORDION.SEC);
		if (systemInsights.userBehaviorInsights.length > 0) v.push(SYSTEM_INSIGHT_ACCORDION.USER);
		if (systemInsights.systemHealthInsights.length > 0) v.push(SYSTEM_INSIGHT_ACCORDION.HEALTH);
		if (systemInsights.trends.length > 0) v.push(SYSTEM_INSIGHT_ACCORDION.TRENDS);
		return v;
	}, [systemInsights]);

	return (
		<div className='space-y-8'>
			{/* System Performance Metrics */}
			<SectionCard
				title={t(AdminKey.PERFORMANCE_METRICS)}
				icon={Layers}
				description={t(AdminKey.PERFORMANCE_METRICS_DESC)}
			>
				{systemPerformanceLoading ? (
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
						<Skeleton variant={SkeletonVariant.Card} count={SKELETON_PLACEHOLDER_COUNTS.CARDS} />
					</div>
				) : systemPerformance ? (
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
						<StatCard
							icon={Zap}
							label={t(AdminKey.RESPONSE_TIME)}
							value={formatNumericValue(systemPerformance.responseTime, 2, 'ms')}
							color={Colors.BLUE_500.text}
						/>
						<StatCard
							icon={HardDrive}
							label={t(AdminKey.MEMORY_USAGE)}
							value={formatNumericValue(systemPerformance.memoryUsage / 1024 / 1024, 2, ' MB')}
							color={Colors.PURPLE_500.text}
						/>
						<StatCard
							icon={Cpu}
							label={t(AdminKey.CPU_USAGE)}
							value={formatNumericValue(systemPerformance.cpuUsage, 2, '%')}
							color={Colors.YELLOW_500.text}
						/>
						<StatCard
							icon={CircleGauge}
							label={t(AdminKey.THROUGHPUT)}
							value={formatNumericValue(systemPerformance.throughput, 2, ' req/s')}
							color={Colors.GREEN_500.text}
						/>
						<StatCard
							icon={AlertTriangle}
							label={t(AdminKey.ERROR_RATE)}
							value={formatNumericValue(systemPerformance.errorRate, 2, '%')}
							color={
								systemPerformance.errorRate > SYSTEM_HEALTH_THRESHOLDS.ERROR_RATE_ATTENTION_PERCENT
									? Colors.RED_500.text
									: Colors.GREEN_500.text
							}
						/>
						<StatCard
							icon={Clock}
							label={t(AdminKey.UPTIME)}
							value={formatNumericValue(systemPerformance.uptime / TIME_DURATIONS_SECONDS.HOUR, 2, 'h')}
							color={Colors.BLUE_500.text}
						/>
					</div>
				) : (
					<div className='text-center py-8 text-muted-foreground'>
						<Zap className='h-12 w-12 mx-auto mb-4 opacity-50' />
						<p>{t(AdminKey.NO_PERFORMANCE_METRICS_AVAILABLE)}</p>
					</div>
				)}
			</SectionCard>

			{/* System Security Metrics */}
			<SectionCard title={t(AdminKey.SECURITY_METRICS)} icon={Layers2} description={t(AdminKey.SECURITY_METRICS_DESC)}>
				{systemSecurityLoading ? (
					<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
						<Skeleton variant={SkeletonVariant.Card} count={3} />
					</div>
				) : systemSecurity ? (
					<Accordion
						type='multiple'
						defaultValue={[
							SECURITY_ACCORDION.AUTH,
							SECURITY_ACCORDION.AUTHZ,
							SECURITY_ACCORDION.DATA,
						]}
						className='w-full'
					>
						<AccordionItem value={SECURITY_ACCORDION.AUTH}>
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
										color={Colors.RED_500.text}
									/>
									<StatCard
										icon={CheckCircle}
										label={t(AdminKey.SUCCESSFUL_LOGINS)}
										value={systemSecurity.authentication.successfulLogins.toLocaleString()}
										color={Colors.GREEN_500.text}
									/>
									<StatCard
										icon={Shield}
										label={t(AdminKey.ACCOUNT_LOCKOUTS)}
										value={systemSecurity.authentication.accountLockouts.toLocaleString()}
										color={Colors.YELLOW_500.text}
									/>
								</div>
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value={SECURITY_ACCORDION.AUTHZ}>
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
										color={Colors.RED_500.text}
									/>
									<StatCard
										icon={Shield}
										label={t(AdminKey.PERMISSION_VIOLATIONS)}
										value={systemSecurity.authorization.permissionViolations.toLocaleString()}
										color={Colors.ORANGE_500.text}
									/>
								</div>
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value={SECURITY_ACCORDION.DATA}>
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
										color={systemSecurity.dataSecurity.dataBreaches > 0 ? Colors.RED_500.text : Colors.GREEN_500.text}
									/>
									<StatCard
										icon={Shield}
										label={t(AdminKey.ENCRYPTION_COVERAGE)}
										value={formatNumericValue(systemSecurity.dataSecurity.encryptionCoverage, 2, '%')}
										color={Colors.BLUE_500.text}
									/>
									<StatCard
										icon={CheckCircle}
										label={t(AdminKey.BACKUP_SUCCESS_RATE)}
										value={formatNumericValue(systemSecurity.dataSecurity.backupSuccessRate, 2, '%')}
										color={Colors.GREEN_500.text}
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

			{/* System Recommendations */}
			{systemRecommendations && systemRecommendations.length > 0 && (
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
							{systemRecommendationsLoading ? (
								<div className='space-y-4'>
									<Skeleton variant={SkeletonVariant.BlockTall} count={SKELETON_PLACEHOLDER_COUNTS.MEDIUM} />
								</div>
							) : (
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
															<strong>{t(AdminKey.RECOMMENDATION_EFFORT)}:</strong>{' '}
															{recommendation.implementationEffort}
														</span>
													</div>
												</div>
											</CardContent>
										</Card>
									))}
								</div>
							)}
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			)}

			{/* System Insights */}
			{systemInsights && (
				<SectionCard title={t(AdminKey.SYSTEM_INSIGHTS)} icon={ScanEye} description={t(AdminKey.SYSTEM_INSIGHTS_DESC)}>
					{systemInsightsLoading ? (
						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
							<Skeleton variant={SkeletonVariant.Card} count={6} />
						</div>
					) : systemInsights ? (
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
									<AccordionItem value={SYSTEM_INSIGHT_ACCORDION.PERF}>
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
									<AccordionItem value={SYSTEM_INSIGHT_ACCORDION.SEC}>
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
									<AccordionItem value={SYSTEM_INSIGHT_ACCORDION.USER}>
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
									<AccordionItem value={SYSTEM_INSIGHT_ACCORDION.HEALTH}>
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
									<AccordionItem value={SYSTEM_INSIGHT_ACCORDION.TRENDS}>
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
					) : (
						<div className='text-center py-8 text-muted-foreground'>
							<ScanEye className='h-12 w-12 mx-auto mb-4 opacity-50' />
							<p>{t(AdminKey.NO_SYSTEM_INSIGHTS_AVAILABLE)}</p>
						</div>
					)}
				</SectionCard>
			)}
		</div>
	);
}
