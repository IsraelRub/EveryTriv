import { useMemo } from 'react';
import {
	Activity,
	BotMessageSquare,
	CheckCircle2,
	CircleDot,
	Clock,
	Percent,
	Send,
	Timer,
	XCircle,
} from 'lucide-react';

import { EMPTY_VALUE, ProviderHealthStatus } from '@shared/constants';
import { formatNumericValue, isRecord, sumBy } from '@shared/utils';
import { VALIDATORS } from '@shared/validation';

import { Colors, SKELETON_PLACEHOLDER_COUNTS, SkeletonVariant, VariantBase } from '@/constants';
import {
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
import { useAiProviderHealth, useAiProviderStats } from '@/hooks';
import { formatDateTime } from '@/utils';

export function ProviderManagementSection() {
	const { data: aiProviderStats, isLoading: aiProviderStatsLoading } = useAiProviderStats();
	const { data: aiProviderHealth, isLoading: aiProviderHealthLoading } = useAiProviderHealth();

	const totalRequests = useMemo(() => {
		if (!aiProviderStats?.providerDetails) return 0;
		return sumBy(Object.values(aiProviderStats.providerDetails), p => p.requests ?? 0);
	}, [aiProviderStats]);

	return (
		<div className='space-y-8'>
			{/* Health Status Card */}
			<Card className='card-muted-tint'>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Activity className='h-5 w-5 text-primary' />
						AI Provider Health Status
					</CardTitle>
					<CardDescription>Real-time health monitoring of AI providers</CardDescription>
				</CardHeader>
				<CardContent>
					{aiProviderHealthLoading ? (
						<Skeleton variant={SkeletonVariant.Card} />
					) : aiProviderHealth ? (
						<div className='flex items-center justify-between'>
							<div>
								<div className='flex items-center gap-2 mb-2'>
									<Badge
										variant={
											aiProviderHealth.status === ProviderHealthStatus.HEALTHY
												? VariantBase.DEFAULT
												: aiProviderHealth.status === ProviderHealthStatus.UNHEALTHY
													? VariantBase.DESTRUCTIVE
													: VariantBase.SECONDARY
										}
									>
										{aiProviderHealth.status.toUpperCase()}
									</Badge>
									<span className='text-sm text-muted-foreground'>
										Last checked: {formatDateTime(aiProviderHealth.timestamp)}
									</span>
								</div>
								<div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
									<StatCard
										icon={CheckCircle2}
										label='Available Providers'
										value={aiProviderHealth.availableProviders}
										color={Colors.GREEN_500.text}
										isLoading={aiProviderHealthLoading}
									/>
									<StatCard
										icon={BotMessageSquare}
										label='Total Providers'
										value={aiProviderHealth.totalProviders}
										color={Colors.BLUE_500.text}
										isLoading={aiProviderHealthLoading}
									/>
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
			<Card className='card-muted-tint'>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<BotMessageSquare className='h-5 w-5 text-primary' />
						AI Providers Statistics
					</CardTitle>
					<CardDescription>Overview of AI provider performance and status</CardDescription>
				</CardHeader>
				<CardContent>
					{aiProviderStatsLoading ? (
						<div className='space-y-4'>
							<Skeleton variant={SkeletonVariant.Card} count={SKELETON_PLACEHOLDER_COUNTS.MEDIUM} />
						</div>
					) : aiProviderStats ? (
						<div className='space-y-6'>
							<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
								<StatCard
									icon={BotMessageSquare}
									label='Total Providers'
									value={aiProviderStats.totalProviders}
									color={Colors.BLUE_500.text}
								/>
								<StatCard
									icon={CircleDot}
									label='Current Provider'
									value={aiProviderStats.providers[aiProviderStats.currentProviderIndex] ?? EMPTY_VALUE}
									color={Colors.GREEN_500.text}
								/>
								<StatCard
									icon={Activity}
									label='Active Providers'
									value={
										Object.values(aiProviderStats.providerDetails).filter((provider: unknown) => {
											if (isRecord(provider) && VALIDATORS.string(provider.status)) {
												return (
													provider.status === ProviderHealthStatus.HEALTHY ||
													provider.status === ProviderHealthStatus.AVAILABLE
												);
											}
											return false;
										}).length
									}
									color={Colors.PURPLE_500.text}
								/>
								<StatCard icon={Send} label='Total Requests' value={totalRequests} color={Colors.YELLOW_500.text} />
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
																	providerStats.status === ProviderHealthStatus.HEALTHY ||
																	providerStats.status === ProviderHealthStatus.AVAILABLE
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
															<StatCard
																icon={Send}
																label='Requests'
																value={providerStats.requests ?? 0}
																color={Colors.BLUE_500.text}
															/>
															<StatCard
																icon={CheckCircle2}
																label='Successes'
																value={providerStats.successes ?? 0}
																color={Colors.GREEN_500.text}
															/>
															<StatCard
																icon={XCircle}
																label='Failures'
																value={providerStats.failures ?? 0}
																color={Colors.RED_500.text}
															/>
															<StatCard
																icon={Percent}
																label='Success Rate'
																value={formatNumericValue(providerStats.successRate, 2, '%')}
																color={Colors.GREEN_500.text}
															/>
															<StatCard
																icon={Timer}
																label='Avg Response Time'
																value={formatNumericValue(providerStats.averageResponseTime, 2, 'ms')}
																color={Colors.YELLOW_500.text}
															/>
															<StatCard
																icon={AlertIconSource}
																label='Error Rate'
																value={formatNumericValue(providerStats.errorRate, 2, '%')}
																color={Colors.RED_500.text}
															/>
															<StatCard
																icon={Clock}
																label='Last Used'
																value={formatDateTime(providerStats.lastUsed, 'Never')}
																color={Colors.BLUE_500.text}
															/>
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
