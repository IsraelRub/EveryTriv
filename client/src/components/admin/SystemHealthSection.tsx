import { Activity, AlertTriangle, BarChart3, GamepadIcon, Settings, Shield, Trophy, Zap } from 'lucide-react';

import { formatForDisplay } from '@shared/utils';

import { StatCardVariant, TextColor, VariantBase } from '@/constants';
import {
	Badge,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	ManagementActions,
	Skeleton,
	StatCard,
} from '@/components';
import {
	useAllTriviaQuestions,
	useClearAllGameHistory,
	useClearAllLeaderboard,
	useClearAllTrivia,
	useClearAllUserStats,
	useGameStatistics,
	useSystemInsights,
	useSystemPerformanceMetrics,
	useSystemRecommendations,
	useSystemSecurityMetrics,
} from '@/hooks';

export function SystemHealthSection() {
	const { data: gameStatistics } = useGameStatistics();
	const { data: triviaQuestions } = useAllTriviaQuestions();
	const clearGameHistory = useClearAllGameHistory();
	const clearTrivia = useClearAllTrivia();
	const clearUserStats = useClearAllUserStats();
	const clearLeaderboard = useClearAllLeaderboard();
	const { data: systemPerformance, isLoading: systemPerformanceLoading } = useSystemPerformanceMetrics();
	const { data: systemSecurity, isLoading: systemSecurityLoading } = useSystemSecurityMetrics();
	const { data: systemRecommendations, isLoading: systemRecommendationsLoading } = useSystemRecommendations();
	const { data: systemInsights, isLoading: systemInsightsLoading } = useSystemInsights();

	return (
		<div className='space-y-8'>
			{/* System Analytics Section */}
			<Card className='border-primary/20 bg-primary/5'>
				<CardHeader>
					<CardTitle className='text-2xl font-bold flex items-center gap-2'>
						<Settings className='h-6 w-6 text-primary' />
						System Analytics
					</CardTitle>
					<CardDescription>System performance, security, and health metrics</CardDescription>
				</CardHeader>
			</Card>

			{/* System Performance Metrics */}
			<Card className='border-muted bg-muted/20'>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Zap className='h-5 w-5' />
						Performance Metrics
					</CardTitle>
					<CardDescription>Real-time system performance indicators</CardDescription>
				</CardHeader>
				<CardContent>
					{systemPerformanceLoading ? (
						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
							{[...Array(4)].map((_, i) => (
								<Skeleton key={i} className='h-24 w-full' />
							))}
						</div>
					) : systemPerformance ? (
						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
							<StatCard
								icon={Zap}
								label='Response Time'
								value={`${formatForDisplay(systemPerformance.responseTime)}ms`}
								color={TextColor.BLUE_500}
								variant={StatCardVariant.VERTICAL}
							/>
							<StatCard
								icon={Activity}
								label='Memory Usage'
								value={`${formatForDisplay(systemPerformance.memoryUsage / 1024 / 1024)} MB`}
								color={TextColor.PURPLE_500}
								variant={StatCardVariant.VERTICAL}
							/>
							<StatCard
								icon={BarChart3}
								label='CPU Usage'
								value={`${formatForDisplay(systemPerformance.cpuUsage)}%`}
								color={TextColor.YELLOW_500}
								variant={StatCardVariant.VERTICAL}
							/>
							<StatCard
								icon={Activity}
								label='Throughput'
								value={`${formatForDisplay(systemPerformance.throughput)} req/s`}
								color={TextColor.GREEN_500}
								variant={StatCardVariant.VERTICAL}
							/>
							<StatCard
								icon={AlertTriangle}
								label='Error Rate'
								value={`${formatForDisplay(systemPerformance.errorRate)}%`}
								color={systemPerformance.errorRate > 5 ? TextColor.RED_500 : TextColor.GREEN_500}
								variant={StatCardVariant.VERTICAL}
							/>
							<StatCard
								icon={Activity}
								label='Uptime'
								value={`${formatForDisplay(systemPerformance.uptime / 3600)}h`}
								color={TextColor.BLUE_500}
								variant={StatCardVariant.VERTICAL}
							/>
						</div>
					) : (
						<div className='text-center py-8 text-muted-foreground'>
							<Zap className='h-12 w-12 mx-auto mb-4 opacity-50' />
							<p>No performance metrics available</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* System Security Metrics */}
			<Card className='border-muted bg-muted/20'>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Shield className='h-5 w-5' />
						Security Metrics
					</CardTitle>
					<CardDescription>Authentication, authorization, and data security indicators</CardDescription>
				</CardHeader>
				<CardContent>
					{systemSecurityLoading ? (
						<div className='space-y-4'>
							{[...Array(3)].map((_, i) => (
								<Skeleton key={i} className='h-24 w-full' />
							))}
						</div>
					) : systemSecurity ? (
						<div className='space-y-6'>
							{/* Authentication Metrics */}
							<Card>
								<CardHeader className='pb-3'>
									<CardTitle className='text-lg'>Authentication</CardTitle>
								</CardHeader>
								<CardContent>
									<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
										<StatCard
											icon={AlertTriangle}
											label='Failed Logins'
											value={systemSecurity.authentication.failedLogins.toLocaleString()}
											color={TextColor.RED_500}
											variant={StatCardVariant.VERTICAL}
										/>
										<StatCard
											icon={Activity}
											label='Successful Logins'
											value={systemSecurity.authentication.successfulLogins.toLocaleString()}
											color={TextColor.GREEN_500}
											variant={StatCardVariant.VERTICAL}
										/>
										<StatCard
											icon={Shield}
											label='Account Lockouts'
											value={systemSecurity.authentication.accountLockouts.toLocaleString()}
											color={TextColor.YELLOW_500}
											variant={StatCardVariant.VERTICAL}
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
											icon={AlertTriangle}
											label='Unauthorized Attempts'
											value={systemSecurity.authorization.unauthorizedAttempts.toLocaleString()}
											color={TextColor.RED_500}
											variant={StatCardVariant.VERTICAL}
										/>
										<StatCard
											icon={Shield}
											label='Permission Violations'
											value={systemSecurity.authorization.permissionViolations.toLocaleString()}
											color={TextColor.ORANGE_500}
											variant={StatCardVariant.VERTICAL}
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
											icon={AlertTriangle}
											label='Data Breaches'
											value={systemSecurity.dataSecurity.dataBreaches.toLocaleString()}
											color={systemSecurity.dataSecurity.dataBreaches > 0 ? TextColor.RED_500 : TextColor.GREEN_500}
											variant={StatCardVariant.VERTICAL}
										/>
										<StatCard
											icon={Shield}
											label='Encryption Coverage'
											value={`${formatForDisplay(systemSecurity.dataSecurity.encryptionCoverage)}%`}
											color={TextColor.BLUE_500}
											variant={StatCardVariant.VERTICAL}
										/>
										<StatCard
											icon={Activity}
											label='Backup Success Rate'
											value={`${formatForDisplay(systemSecurity.dataSecurity.backupSuccessRate)}%`}
											color={TextColor.GREEN_500}
											variant={StatCardVariant.VERTICAL}
										/>
									</div>
								</CardContent>
							</Card>
						</div>
					) : (
						<div className='text-center py-8 text-muted-foreground'>
							<Shield className='h-12 w-12 mx-auto mb-4 opacity-50' />
							<p>No security metrics available</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* System Recommendations */}
			{systemRecommendations && systemRecommendations.length > 0 && (
				<Card className='border-muted bg-muted/20'>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<AlertTriangle className='h-5 w-5' />
							System Recommendations
						</CardTitle>
						<CardDescription>Actionable recommendations to improve system performance and security</CardDescription>
					</CardHeader>
					<CardContent>
						{systemRecommendationsLoading ? (
							<div className='space-y-4'>
								{[...Array(3)].map((_, i) => (
									<Skeleton key={i} className='h-32 w-full' />
								))}
							</div>
						) : (
							<div className='space-y-4'>
								{systemRecommendations.map(recommendation => (
									<Card key={recommendation.id} className='border-l-4 border-l-yellow-500'>
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
				<Card className='border-muted bg-muted/20'>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<BarChart3 className='h-5 w-5' />
							System Insights
						</CardTitle>
						<CardDescription>Key insights about system health, performance, and user behavior</CardDescription>
					</CardHeader>
					<CardContent>
						{systemInsightsLoading ? (
							<div className='space-y-4'>
								{[...Array(4)].map((_, i) => (
									<Skeleton key={i} className='h-20 w-full' />
								))}
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
										Last updated: {new Date(systemInsights.timestamp).toLocaleString()}
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
												<BarChart3 className='h-4 w-4' />
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
								<BarChart3 className='h-12 w-12 mx-auto mb-4 opacity-50' />
								<p>No system insights available</p>
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{/* System Operations */}
			<Card className='border-muted bg-muted/20'>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Settings className='h-5 w-5' />
						Data Management
					</CardTitle>
					<CardDescription>Clear all data types from the system</CardDescription>
				</CardHeader>
				<CardContent>
					<ManagementActions
						operations={[
							{
								id: 'clear-game-history',
								title: 'Clear Game History',
								description: 'Delete all game history records from the system',
								itemName: 'Game History',
								currentCount: gameStatistics?.totalGames,
								onClear: () => clearGameHistory.mutate(),
								isLoading: clearGameHistory.isPending,
								icon: GamepadIcon,
							},
							{
								id: 'clear-trivia',
								title: 'Clear Trivia Questions',
								description: 'Delete all trivia questions from the database',
								itemName: 'Trivia Questions',
								currentCount: triviaQuestions?.totalCount,
								onClear: () => clearTrivia.mutate(),
								isLoading: clearTrivia.isPending,
								icon: GamepadIcon,
							},
							{
								id: 'clear-user-stats',
								title: 'Clear User Stats',
								description: 'Delete all user analytics and statistics',
								itemName: 'User Stats',
								onClear: () => clearUserStats.mutate(),
								isLoading: clearUserStats.isPending,
								icon: Activity,
							},
							{
								id: 'clear-leaderboard',
								title: 'Clear Leaderboard',
								description: 'Reset all leaderboard rankings and scores',
								itemName: 'Leaderboard',
								onClear: () => clearLeaderboard.mutate(),
								isLoading: clearLeaderboard.isPending,
								icon: Trophy,
							},
						]}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
