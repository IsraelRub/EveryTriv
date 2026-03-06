import {
	Activity,
	CheckCircle,
	CircleGauge,
	Clock,
	Cpu,
	Fingerprint,
	HardDrive,
	Lightbulb,
	Shield,
	TrendingUp,
	Zap,
} from 'lucide-react';

import { SYSTEM_HEALTH_THRESHOLDS, TIME_DURATIONS_SECONDS } from '@shared/constants';
import { formatNumericValue } from '@shared/utils';

import { Colors, SKELETON_PLACEHOLDER_COUNTS, SkeletonVariant, VariantBase } from '@/constants';
import {
	AlertIcon,
	AlertIconSource,
	Badge,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Skeleton,
	StatCard,
} from '@/components';
import {
	useSystemInsights,
	useSystemPerformanceMetrics,
	useSystemRecommendations,
	useSystemSecurityMetrics,
} from '@/hooks';
import { formatDateTime } from '@/utils';

export function SystemHealthSection() {
	const { data: systemPerformance, isLoading: systemPerformanceLoading } = useSystemPerformanceMetrics();
	const { data: systemSecurity, isLoading: systemSecurityLoading } = useSystemSecurityMetrics();
	const { data: systemRecommendations, isLoading: systemRecommendationsLoading } = useSystemRecommendations();
	const { data: systemInsights, isLoading: systemInsightsLoading } = useSystemInsights();

	return (
		<div className='space-y-8'>
			{/* System Performance Metrics */}
			<Card className='card-muted-tint'>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Zap className='h-5 w-5 text-primary' />
						Performance Metrics
					</CardTitle>
					<CardDescription>Real-time system performance indicators</CardDescription>
				</CardHeader>
				<CardContent>
					{systemPerformanceLoading ? (
						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
							<Skeleton variant={SkeletonVariant.Card} count={SKELETON_PLACEHOLDER_COUNTS.CARDS} />
						</div>
					) : systemPerformance ? (
						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
							<StatCard
								icon={Zap}
								label='Response Time'
								value={formatNumericValue(systemPerformance.responseTime, 2, 'ms')}
								color={Colors.BLUE_500.text}
							/>
							<StatCard
								icon={HardDrive}
								label='Memory Usage'
								value={formatNumericValue(systemPerformance.memoryUsage / 1024 / 1024, 2, ' MB')}
								color={Colors.PURPLE_500.text}
							/>
							<StatCard
								icon={Cpu}
								label='CPU Usage'
								value={formatNumericValue(systemPerformance.cpuUsage, 2, '%')}
								color={Colors.YELLOW_500.text}
							/>
							<StatCard
								icon={CircleGauge}
								label='Throughput'
								value={formatNumericValue(systemPerformance.throughput, 2, ' req/s')}
								color={Colors.GREEN_500.text}
							/>
							<StatCard
								icon={AlertIconSource}
								label='Error Rate'
								value={formatNumericValue(systemPerformance.errorRate, 2, '%')}
								color={
									systemPerformance.errorRate > SYSTEM_HEALTH_THRESHOLDS.ERROR_RATE_ATTENTION_PERCENT
										? Colors.RED_500.text
										: Colors.GREEN_500.text
								}
							/>
							<StatCard
								icon={Clock}
								label='Uptime'
								value={formatNumericValue(systemPerformance.uptime / TIME_DURATIONS_SECONDS.HOUR, 2, 'h')}
								color={Colors.BLUE_500.text}
							/>
						</div>
					) : (
						<div className='text-center py-8 text-muted-foreground'>
							<Zap className='h-12 w-12 mx-auto mb-4 opacity-50' />
							<p>No Performance Metrics Available</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* System Security Metrics */}
			<Card className='card-muted-tint'>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Shield className='h-5 w-5 text-primary' />
						Security Metrics
					</CardTitle>
					<CardDescription>Authentication, authorization, and data security indicators</CardDescription>
				</CardHeader>
				<CardContent>
					{systemSecurityLoading ? (
						<div className='space-y-4'>
							<Skeleton variant={SkeletonVariant.Card} count={SKELETON_PLACEHOLDER_COUNTS.MEDIUM} />
						</div>
					) : systemSecurity ? (
						<div className='space-y-6'>
							{/* Authentication Metrics */}
							<Card>
								<CardHeader className='pb-3'>
									<CardTitle className='text-lg flex items-center gap-2'>
										<Fingerprint className='h-5 w-5 text-primary' />
										Authentication
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
										<StatCard
											icon={AlertIconSource}
											label='Failed Logins'
											value={systemSecurity.authentication.failedLogins.toLocaleString()}
											color={Colors.RED_500.text}
										/>
										<StatCard
											icon={CheckCircle}
											label='Successful Logins'
											value={systemSecurity.authentication.successfulLogins.toLocaleString()}
											color={Colors.GREEN_500.text}
										/>
										<StatCard
											icon={Shield}
											label='Account Lockouts'
											value={systemSecurity.authentication.accountLockouts.toLocaleString()}
											color={Colors.YELLOW_500.text}
										/>
									</div>
								</CardContent>
							</Card>

							{/* Authorization Metrics */}
							<Card>
								<CardHeader className='pb-3'>
									<CardTitle className='text-lg'>Authorization</CardTitle>
								</CardHeader>
								<CardContent>
									<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
										<StatCard
											icon={AlertIconSource}
											label='Unauthorized Attempts'
											value={systemSecurity.authorization.unauthorizedAttempts.toLocaleString()}
											color={Colors.RED_500.text}
										/>
										<StatCard
											icon={Shield}
											label='Permission Violations'
											value={systemSecurity.authorization.permissionViolations.toLocaleString()}
											color={Colors.ORANGE_500.text}
										/>
									</div>
								</CardContent>
							</Card>

							{/* Data Security Metrics */}
							<Card>
								<CardHeader className='pb-3'>
									<CardTitle className='text-lg'>Data Security</CardTitle>
								</CardHeader>
								<CardContent>
									<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
										<StatCard
											icon={AlertIconSource}
											label='Data Breaches'
											value={systemSecurity.dataSecurity.dataBreaches.toLocaleString()}
											color={systemSecurity.dataSecurity.dataBreaches > 0 ? Colors.RED_500.text : Colors.GREEN_500.text}
										/>
										<StatCard
											icon={Shield}
											label='Encryption Coverage'
											value={formatNumericValue(systemSecurity.dataSecurity.encryptionCoverage, 2, '%')}
											color={Colors.BLUE_500.text}
										/>
										<StatCard
											icon={CheckCircle}
											label='Backup Success Rate'
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
							<p>No Security Metrics Available</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* System Recommendations */}
			{systemRecommendations && systemRecommendations.length > 0 && (
				<Card className='card-muted-tint'>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<AlertIcon size='lg' className='text-primary' />
							System Recommendations
						</CardTitle>
						<CardDescription>Actionable recommendations to improve system performance and security</CardDescription>
					</CardHeader>
					<CardContent>
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
													variant={recommendation.priority === 'high' ? VariantBase.DESTRUCTIVE : VariantBase.SECONDARY}
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
														<strong>Action:</strong> {recommendation.action}
													</span>
													<span>
														<strong>Impact:</strong> {recommendation.estimatedImpact}
													</span>
													<span>
														<strong>Effort:</strong> {recommendation.implementationEffort}
													</span>
												</div>
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{/* System Insights */}
			{systemInsights && (
				<Card className='card-muted-tint'>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Lightbulb className='h-5 w-5 text-primary' />
							System Insights
						</CardTitle>
						<CardDescription>Key insights about system health, performance, and user behavior</CardDescription>
					</CardHeader>
					<CardContent>
						{systemInsightsLoading ? (
							<div className='space-y-4'>
								<Skeleton variant={SkeletonVariant.BlockSm} count={SKELETON_PLACEHOLDER_COUNTS.CARDS} />
							</div>
						) : systemInsights ? (
							<div className='space-y-6'>
								<div className='flex items-center gap-2 mb-4'>
									<Badge
										variant={
											systemInsights.status === 'healthy'
												? VariantBase.DEFAULT
												: systemInsights.status === 'warning'
													? VariantBase.SECONDARY
													: VariantBase.DESTRUCTIVE
										}
									>
										{systemInsights.status.toUpperCase()}
									</Badge>
									<span className='text-sm text-muted-foreground'>
										Last updated: {formatDateTime(systemInsights.timestamp)}
									</span>
								</div>

								{systemInsights.performanceInsights.length > 0 && (
									<Card>
										<CardHeader className='pb-3'>
											<CardTitle className='text-lg flex items-center gap-2'>
												<Zap className='h-4 w-4' />
												Performance Insights
											</CardTitle>
										</CardHeader>
										<CardContent>
											<ul className='space-y-2'>
												{systemInsights.performanceInsights.map((insight, index) => (
													<li key={index} className='flex items-start gap-2 text-sm'>
														<span className='text-primary mt-1'>•</span>
														<span>{insight}</span>
													</li>
												))}
											</ul>
										</CardContent>
									</Card>
								)}

								{systemInsights.securityInsights.length > 0 && (
									<Card>
										<CardHeader className='pb-3'>
											<CardTitle className='text-lg flex items-center gap-2'>
												<Shield className='h-4 w-4' />
												Security Insights
											</CardTitle>
										</CardHeader>
										<CardContent>
											<ul className='space-y-2'>
												{systemInsights.securityInsights.map((insight, index) => (
													<li key={index} className='flex items-start gap-2 text-sm'>
														<span className='text-primary mt-1'>•</span>
														<span>{insight}</span>
													</li>
												))}
											</ul>
										</CardContent>
									</Card>
								)}

								{systemInsights.userBehaviorInsights.length > 0 && (
									<Card>
										<CardHeader className='pb-3'>
											<CardTitle className='text-lg flex items-center gap-2'>
												<Activity className='h-4 w-4' />
												User Behavior Insights
											</CardTitle>
										</CardHeader>
										<CardContent>
											<ul className='space-y-2'>
												{systemInsights.userBehaviorInsights.map((insight, index) => (
													<li key={index} className='flex items-start gap-2 text-sm'>
														<span className='text-primary mt-1'>•</span>
														<span>{insight}</span>
													</li>
												))}
											</ul>
										</CardContent>
									</Card>
								)}

								{systemInsights.systemHealthInsights.length > 0 && (
									<Card>
										<CardHeader className='pb-3'>
											<CardTitle className='text-lg flex items-center gap-2'>
												<Activity className='h-4 w-4' />
												System Health Insights
											</CardTitle>
										</CardHeader>
										<CardContent>
											<ul className='space-y-2'>
												{systemInsights.systemHealthInsights.map((insight, index) => (
													<li key={index} className='flex items-start gap-2 text-sm'>
														<span className='text-primary mt-1'>•</span>
														<span>{insight}</span>
													</li>
												))}
											</ul>
										</CardContent>
									</Card>
								)}

								{systemInsights.trends.length > 0 && (
									<Card>
										<CardHeader className='pb-3'>
											<CardTitle className='text-lg flex items-center gap-2'>
												<TrendingUp className='h-4 w-4' />
												Trends
											</CardTitle>
										</CardHeader>
										<CardContent>
											<ul className='space-y-2'>
												{systemInsights.trends.map((trend, index) => (
													<li key={index} className='flex items-start gap-2 text-sm'>
														<span className='text-primary mt-1'>•</span>
														<span>{trend}</span>
													</li>
												))}
											</ul>
										</CardContent>
									</Card>
								)}
							</div>
						) : (
							<div className='text-center py-8 text-muted-foreground'>
								<Lightbulb className='h-12 w-12 mx-auto mb-4 opacity-50' />
								<p>No System Insights Available</p>
							</div>
						)}
					</CardContent>
				</Card>
			)}
		</div>
	);
}
