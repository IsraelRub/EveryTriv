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

export function SystemHealthSection() {
	const { t } = useTranslation();
	const { data: systemPerformance, isLoading: systemPerformanceLoading } = useSystemPerformanceMetrics();
	const { data: systemSecurity, isLoading: systemSecurityLoading } = useSystemSecurityMetrics();
	const { data: systemRecommendations, isLoading: systemRecommendationsLoading } = useSystemRecommendations();
	const { data: systemInsights, isLoading: systemInsightsLoading } = useSystemInsights();

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
					<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
						{/* Authentication Metrics */}
						<Card>
							<CardHeader className='pb-3'>
								<CardTitle className='text-lg flex items-center gap-2'>
									<LogIn className='h-5 w-5 text-primary' />
									{t(AdminKey.AUTHENTICATION)}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className='space-y-4'>
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
							</CardContent>
						</Card>

						{/* Authorization Metrics */}
						<Card>
							<CardHeader className='pb-3'>
								<CardTitle className='text-lg flex items-center gap-2'>
									<KeyRound className='h-5 w-5 text-primary' />
									{t(AdminKey.AUTHORIZATION)}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className='space-y-4'>
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
							</CardContent>
						</Card>

						{/* Data Security Metrics */}
						<Card>
							<CardHeader className='pb-3'>
								<CardTitle className='text-lg flex items-center gap-2'>
									<Database className='h-5 w-5 text-primary' />
									{t(AdminKey.DATA_SECURITY)}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className='space-y-4'>
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
							</CardContent>
						</Card>
					</div>
				) : (
					<div className='text-center py-8 text-muted-foreground'>
						<Shield className='h-12 w-12 mx-auto mb-4 opacity-50' />
						<p>{t(AdminKey.NO_SECURITY_METRICS_AVAILABLE)}</p>
					</div>
				)}
			</SectionCard>

			{/* System Recommendations */}
			{systemRecommendations && systemRecommendations.length > 0 && (
				<SectionCard
					title={t(AdminKey.SYSTEM_RECOMMENDATIONS)}
					icon={Lightbulb}
					description={t(AdminKey.SECURITY_RECOMMENDATIONS_DESC)}
				>
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
												<CardTitle className='text-lg mb-1'>{recommendation.title}</CardTitle>
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
					)}
				</SectionCard>
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
							<div className='flex items-center gap-2 mb-4'>
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

							<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
								{systemInsights.performanceInsights.length > 0 && (
									<Card>
										<CardHeader className='pb-3'>
											<CardTitle className='text-lg flex items-center gap-2'>
												<Zap className='h-5 w-5 text-primary' />
												Performance Insights
											</CardTitle>
										</CardHeader>
										<CardContent>
											<div className='space-y-3'>
												{systemInsights.performanceInsights.map((insight, index) => (
													<div key={index} className='p-3 rounded-lg bg-muted/50'>
														<span className='text-sm'>{insight}</span>
													</div>
												))}
											</div>
										</CardContent>
									</Card>
								)}

								{systemInsights.securityInsights.length > 0 && (
									<Card>
										<CardHeader className='pb-3'>
											<CardTitle className='text-lg flex items-center gap-2'>
												<Shield className='h-5 w-5 text-primary' />
												Security Insights
											</CardTitle>
										</CardHeader>
										<CardContent>
											<div className='space-y-3'>
												{systemInsights.securityInsights.map((insight, index) => (
													<div key={index} className='p-3 rounded-lg bg-muted/50'>
														<span className='text-sm'>{insight}</span>
													</div>
												))}
											</div>
										</CardContent>
									</Card>
								)}

								{systemInsights.userBehaviorInsights.length > 0 && (
									<Card>
										<CardHeader className='pb-3'>
											<CardTitle className='text-lg flex items-center gap-2'>
												<Activity className='h-5 w-5 text-primary' />
												User Behavior Insights
											</CardTitle>
										</CardHeader>
										<CardContent>
											<div className='space-y-3'>
												{systemInsights.userBehaviorInsights.map((insight, index) => (
													<div key={index} className='p-3 rounded-lg bg-muted/50'>
														<span className='text-sm'>{insight}</span>
													</div>
												))}
											</div>
										</CardContent>
									</Card>
								)}

								{systemInsights.systemHealthInsights.length > 0 && (
									<Card>
										<CardHeader className='pb-3'>
											<CardTitle className='text-lg flex items-center gap-2'>
												<Activity className='h-5 w-5 text-primary' />
												System Health Insights
											</CardTitle>
										</CardHeader>
										<CardContent>
											<div className='space-y-3'>
												{systemInsights.systemHealthInsights.map((insight, index) => (
													<div key={index} className='p-3 rounded-lg bg-muted/50'>
														<span className='text-sm'>{insight}</span>
													</div>
												))}
											</div>
										</CardContent>
									</Card>
								)}

								{systemInsights.trends.length > 0 && (
									<Card>
										<CardHeader className='pb-3'>
											<CardTitle className='text-lg flex items-center gap-2'>
												<TrendingUp className='h-5 w-5 text-primary' />
												Trends
											</CardTitle>
										</CardHeader>
										<CardContent>
											<div className='space-y-3'>
												{systemInsights.trends.map((trend, index) => (
													<div key={index} className='p-3 rounded-lg bg-muted/50'>
														<span className='text-sm'>{trend}</span>
													</div>
												))}
											</div>
										</CardContent>
									</Card>
								)}
							</div>
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
