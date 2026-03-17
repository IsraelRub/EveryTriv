import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
	Activity,
	AlertTriangle,
	BotMessageSquare,
	CheckCircle2,
	CircleDot,
	CirclePercent,
	Clock,
	Send,
	Timer,
	XCircle,
} from 'lucide-react';

import { EMPTY_VALUE, ProviderHealthStatus } from '@shared/constants';
import { formatNumericValue, isRecord, sumBy } from '@shared/utils';
import { VALIDATORS } from '@shared/validation';

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
import { useAiProviderHealth, useAiProviderStats } from '@/hooks';

export function ProviderManagementSection() {
	const { t } = useTranslation();
	const { data: aiProviderStats, isLoading: aiProviderStatsLoading } = useAiProviderStats();
	const { data: aiProviderHealth, isLoading: aiProviderHealthLoading } = useAiProviderHealth();

	const totalRequests = useMemo(() => {
		if (!aiProviderStats?.providerDetails) return 0;
		return sumBy(Object.values(aiProviderStats.providerDetails), p => p.requests ?? 0);
	}, [aiProviderStats]);

	return (
		<div className='space-y-8'>
			{/* Health Status Card */}
			<SectionCard
				title={t(AdminKey.AI_PROVIDER_HEALTH_STATUS)}
				icon={Activity}
				description={t(AdminKey.AI_PROVIDER_HEALTH_STATUS_DESC)}
			>
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
									{aiProviderHealth.status === ProviderHealthStatus.HEALTHY
										? t(AdminKey.HEALTH_STATUS_HEALTHY)
										: aiProviderHealth.status === ProviderHealthStatus.UNHEALTHY
											? t(AdminKey.HEALTH_STATUS_UNHEALTHY)
											: t(AdminKey.HEALTH_STATUS_UNKNOWN)}
								</Badge>
								<span className='text-sm text-muted-foreground'>
									{t(AdminKey.LAST_CHECKED)} {formatDateTime(aiProviderHealth.timestamp)}
								</span>
							</div>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
								<StatCard
									icon={CheckCircle2}
									label={t(AdminKey.AVAILABLE_PROVIDERS)}
									value={aiProviderHealth.availableProviders}
									color={Colors.GREEN_500.text}
									isLoading={aiProviderHealthLoading}
								/>
								<StatCard
									icon={BotMessageSquare}
									label={t(AdminKey.TOTAL_PROVIDERS)}
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
						<p>{t(AdminKey.NO_HEALTH_STATUS_AVAILABLE)}</p>
					</div>
				)}
			</SectionCard>

			{/* AI Providers Statistics */}
			<SectionCard
				title={t(AdminKey.AI_PROVIDERS_STATISTICS)}
				icon={BotMessageSquare}
				description={t(AdminKey.AI_PROVIDERS_STATISTICS_DESC)}
			>
				{aiProviderStatsLoading ? (
					<div className='space-y-4'>
						<Skeleton variant={SkeletonVariant.Card} count={SKELETON_PLACEHOLDER_COUNTS.MEDIUM} />
					</div>
				) : aiProviderStats ? (
					<div className='space-y-6'>
						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
							<StatCard
								icon={BotMessageSquare}
								label={t(AdminKey.TOTAL_PROVIDERS)}
								value={aiProviderStats.totalProviders}
								color={Colors.BLUE_500.text}
							/>
							<StatCard
								icon={CircleDot}
								label={t(AdminKey.CURRENT_PROVIDER)}
								value={aiProviderStats.providers[aiProviderStats.currentProviderIndex] ?? EMPTY_VALUE}
								color={Colors.GREEN_500.text}
							/>
							<StatCard
								icon={Activity}
								label={t(AdminKey.ACTIVE_PROVIDERS)}
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
							<StatCard
								icon={Send}
								label={t(AdminKey.TOTAL_REQUESTS)}
								value={totalRequests}
								color={Colors.YELLOW_500.text}
							/>
						</div>

						<Card className='border-muted/50 bg-muted/10'>
							<CardHeader>
								<CardTitle>{t(AdminKey.PROVIDER_DETAILS)}</CardTitle>
								<CardDescription>{t(AdminKey.PROVIDER_DETAILS_DESC)}</CardDescription>
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
															{providerStats.status === ProviderHealthStatus.HEALTHY ||
															providerStats.status === ProviderHealthStatus.AVAILABLE
																? t(AdminKey.HEALTH_STATUS_HEALTHY)
																: providerStats.status === ProviderHealthStatus.UNHEALTHY
																	? t(AdminKey.HEALTH_STATUS_UNHEALTHY)
																	: t(AdminKey.HEALTH_STATUS_UNKNOWN)}
														</Badge>
													</div>
												</CardHeader>
												<CardContent>
													<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
														<StatCard
															icon={Send}
															label={t(AdminKey.REQUESTS)}
															value={providerStats.requests ?? 0}
															color={Colors.BLUE_500.text}
														/>
														<StatCard
															icon={CheckCircle2}
															label={t(AdminKey.SUCCESSES)}
															value={providerStats.successes ?? 0}
															color={Colors.GREEN_500.text}
														/>
														<StatCard
															icon={XCircle}
															label={t(AdminKey.FAILURES)}
															value={providerStats.failures ?? 0}
															color={Colors.RED_500.text}
														/>
														<StatCard
															icon={CirclePercent}
															label={t(AdminKey.SUCCESS_RATE)}
															value={formatNumericValue(providerStats.successRate, 2, '%')}
															color={Colors.GREEN_500.text}
														/>
														<StatCard
															icon={Timer}
															label={t(AdminKey.AVG_RESPONSE_TIME)}
															value={formatNumericValue(providerStats.averageResponseTime, 2, 'ms')}
															color={Colors.YELLOW_500.text}
														/>
														<StatCard
															icon={AlertTriangle}
															label={t(AdminKey.ERROR_RATE)}
															value={formatNumericValue(providerStats.errorRate, 2, '%')}
															color={Colors.RED_500.text}
														/>
														<StatCard
															icon={Clock}
															label={t(AdminKey.LAST_USED)}
															value={formatDateTime(providerStats.lastUsed, t(AdminKey.DATE_DEFAULT_NEVER))}
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
						<p>{t(AdminKey.NO_AI_PROVIDER_STATS_AVAILABLE)}</p>
					</div>
				)}
			</SectionCard>
		</div>
	);
}
