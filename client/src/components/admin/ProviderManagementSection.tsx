import { Activity, BarChart3 } from 'lucide-react';

import { ProviderStatus as ProviderStatusEnum } from '@shared/constants';
import { formatForDisplay, isRecord } from '@shared/utils';

import { StatCardVariant, TextColor, VariantBase } from '@/constants';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton, StatCard } from '@/components';
import { useAiProviderHealth, useAiProviderStats } from '@/hooks';

export function ProviderManagementSection() {
	const { data: aiProviderStats, isLoading: aiProviderStatsLoading } = useAiProviderStats();
	const { data: aiProviderHealth, isLoading: aiProviderHealthLoading } = useAiProviderHealth();

	return (
		<div className='space-y-8'>
			{/* AI Provider Management Section */}
			<Card className='border-primary/20 bg-primary/5'>
				<CardHeader>
					<CardTitle className='text-2xl font-bold flex items-center gap-2'>
						<Activity className='h-6 w-6 text-primary' />
						AI Provider Management
					</CardTitle>
					<CardDescription>Monitor and manage AI provider health, statistics, and performance</CardDescription>
				</CardHeader>
			</Card>

			{/* Health Status Card */}
			<Card className='border-muted bg-muted/20'>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Activity className='h-5 w-5' />
						AI Provider Health Status
					</CardTitle>
					<CardDescription>Real-time health monitoring of AI providers</CardDescription>
				</CardHeader>
				<CardContent>
					{aiProviderHealthLoading ? (
						<Skeleton className='h-24 w-full' />
					) : aiProviderHealth ? (
						<div className='flex items-center justify-between'>
							<div>
								<div className='flex items-center gap-2 mb-2'>
									<Badge
										variant={
											aiProviderHealth.status === ProviderStatusEnum.HEALTHY
												? VariantBase.DEFAULT
												: aiProviderHealth.status === ProviderStatusEnum.UNHEALTHY
													? VariantBase.DESTRUCTIVE
													: VariantBase.SECONDARY
										}
									>
										{aiProviderHealth.status.toUpperCase()}
									</Badge>
									<span className='text-sm text-muted-foreground'>
										Last checked: {new Date(aiProviderHealth.timestamp).toLocaleTimeString()}
									</span>
								</div>
								<div className='grid grid-cols-2 gap-4 mt-4'>
									<div>
										<p className='text-sm text-muted-foreground'>Available Providers</p>
										<p className='text-2xl font-bold text-green-500'>{aiProviderHealth.availableProviders}</p>
									</div>
									<div>
										<p className='text-sm text-muted-foreground'>Total Providers</p>
										<p className='text-2xl font-bold'>{aiProviderHealth.totalProviders}</p>
									</div>
								</div>
								{aiProviderHealth.error && (
									<div className='mt-4 p-3 bg-destructive/10 border border-destructive rounded-md'>
										<p className='text-sm text-destructive'>{aiProviderHealth.error}</p>
									</div>
								)}
							</div>
						</div>
					) : (
						<div className='text-center py-8 text-muted-foreground'>
							<Activity className='h-12 w-12 mx-auto mb-4 opacity-50' />
							<p>No health status available</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* AI Providers Statistics */}
			<Card className='border-muted bg-muted/20'>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<BarChart3 className='h-5 w-5' />
						AI Providers Statistics
					</CardTitle>
					<CardDescription>Overview of AI provider performance and status</CardDescription>
				</CardHeader>
				<CardContent>
					{aiProviderStatsLoading ? (
						<div className='space-y-4'>
							{[...Array(3)].map((_, i) => (
								<Skeleton key={i} className='h-24 w-full' />
							))}
						</div>
					) : aiProviderStats ? (
						<div className='space-y-6'>
							<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
								<StatCard
									icon={Activity}
									label='Total Providers'
									value={aiProviderStats.totalProviders}
									color={TextColor.BLUE_500}
									variant={StatCardVariant.VERTICAL}
								/>
								<StatCard
									icon={Activity}
									label='Current Provider'
									value={aiProviderStats.providers[aiProviderStats.currentProviderIndex] ?? 'N/A'}
									color={TextColor.GREEN_500}
									variant={StatCardVariant.VERTICAL}
								/>
								<StatCard
									icon={Activity}
									label='Active Providers'
									value={
										Object.values(aiProviderStats.providerDetails).filter((provider: unknown) => {
											if (isRecord(provider) && typeof provider.status === 'string') {
												return (
													provider.status === ProviderStatusEnum.HEALTHY ||
													provider.status === ProviderStatusEnum.ACTIVE
												);
											}
											return false;
										}).length
									}
									color={TextColor.PURPLE_500}
									variant={StatCardVariant.VERTICAL}
								/>
								<StatCard
									icon={Activity}
									label='Total Requests'
									value={Object.values(aiProviderStats.providerDetails).reduce((sum, provider) => {
										return sum + (provider.requests ?? 0);
									}, 0)}
									color={TextColor.YELLOW_500}
									variant={StatCardVariant.VERTICAL}
								/>
							</div>

							<Card className='border-muted/50 bg-muted/10'>
								<CardHeader>
									<CardTitle>Provider Details</CardTitle>
									<CardDescription>Individual provider statistics</CardDescription>
								</CardHeader>
								<CardContent>
									<div className='space-y-4'>
										{Object.entries(aiProviderStats.providerDetails).map(([name, providerStats]) => {
											return (
												<Card key={name}>
													<CardHeader className='pb-3'>
														<div className='flex items-center justify-between'>
															<CardTitle className='text-lg'>{name}</CardTitle>
															<Badge
																variant={
																	providerStats.status === ProviderStatusEnum.HEALTHY ||
																	providerStats.status === ProviderStatusEnum.ACTIVE
																		? VariantBase.DEFAULT
																		: VariantBase.DESTRUCTIVE
																}
															>
																{providerStats.status ?? 'unknown'}
															</Badge>
														</div>
													</CardHeader>
													<CardContent>
														<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
															<div>
																<p className='text-sm text-muted-foreground'>Requests</p>
																<p className='text-lg font-bold'>{providerStats.requests ?? 0}</p>
															</div>
															<div>
																<p className='text-sm text-muted-foreground'>Successes</p>
																<p className='text-lg font-bold text-green-500'>{providerStats.successes ?? 0}</p>
															</div>
															<div>
																<p className='text-sm text-muted-foreground'>Failures</p>
																<p className='text-lg font-bold text-red-500'>{providerStats.failures ?? 0}</p>
															</div>
															<div>
																<p className='text-sm text-muted-foreground'>Success Rate</p>
																<p className='text-lg font-bold'>{formatForDisplay(providerStats.successRate ?? 0)}%</p>
															</div>
															<div>
																<p className='text-sm text-muted-foreground'>Avg Response Time</p>
																<p className='text-lg font-bold'>
																	{formatForDisplay(providerStats.averageResponseTime ?? 0)}ms
																</p>
															</div>
															<div>
																<p className='text-sm text-muted-foreground'>Error Rate</p>
																<p className='text-lg font-bold text-red-500'>
																	{formatForDisplay(providerStats.errorRate ?? 0)}%
																</p>
															</div>
															<div>
																<p className='text-sm text-muted-foreground'>Last Used</p>
																<p className='text-lg font-bold'>
																	{providerStats.lastUsed ? new Date(providerStats.lastUsed).toLocaleString() : 'Never'}
																</p>
															</div>
														</div>
													</CardContent>
												</Card>
											);
										})}
									</div>
								</CardContent>
							</Card>
						</div>
					) : (
						<div className='text-center py-8 text-muted-foreground'>
							<Activity className='h-12 w-12 mx-auto mb-4 opacity-50' />
							<p>No AI provider statistics available</p>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
