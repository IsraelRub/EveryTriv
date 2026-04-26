import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
	AlertCircle,
	Award,
	BookOpen,
	Calendar,
	CircleStar,
	Clock,
	Crosshair,
	FileQuestion,
	GamepadIcon,
	Medal,
	Tag,
	Target,
	TrendingUp,
} from 'lucide-react';

import { EMPTY_VALUE } from '@shared/constants';
import { formatDate, formatNumericValue, formatTitle } from '@shared/utils';

import {
	AdminKey,
	SEMANTIC_ICON_TEXT,
	SKELETON_PLACEHOLDER_COUNTS,
	SkeletonVariant,
	StatCardVariant,
	UserAnalysisAccordion,
} from '@/constants';
import type { UserAnalysisExpandedPanelProps } from '@/types';
import { cn, formatUserInsightLine, translateAdminRecommendation, translateRecommendationPriority } from '@/utils';
import { StatCard } from '@/components/statistics/StatCard';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';

export const UserAnalysisExpandedPanel = memo(function UserAnalysisExpandedPanel({
	analysisLoading,
	summaryError,
	summaryData,
	statisticsData,
	performanceData,
	insightsData,
	recommendationsData,
}: UserAnalysisExpandedPanelProps): JSX.Element {
	const { t } = useTranslation();

	const hasInsightsBlock = useMemo(() => {
		if (insightsData == null || summaryData == null) return false;
		return (
			(summaryData.highlights?.topTopics?.length ?? 0) > 0 ||
			(insightsData.strengths?.length ?? 0) > 0 ||
			(insightsData.improvements?.length ?? 0) > 0 ||
			(insightsData.recentHighlights?.length ?? 0) > 0
		);
	}, [insightsData, summaryData]);

	const defaultAccordionLeft = useMemo((): UserAnalysisAccordion[] => {
		const keys: UserAnalysisAccordion[] = [UserAnalysisAccordion.OVERVIEW];
		if (statisticsData != null) keys.push(UserAnalysisAccordion.STATISTICS);
		if (performanceData != null) keys.push(UserAnalysisAccordion.PERFORMANCE);
		return keys;
	}, [statisticsData, performanceData]);

	const defaultAccordionRight = useMemo((): UserAnalysisAccordion[] => {
		const keys: UserAnalysisAccordion[] = [];
		if (hasInsightsBlock && insightsData != null) keys.push(UserAnalysisAccordion.INSIGHTS);
		if (recommendationsData != null && recommendationsData.length > 0) {
			keys.push(UserAnalysisAccordion.RECOMMENDATIONS);
		}
		return keys;
	}, [hasInsightsBlock, insightsData, recommendationsData]);

	const showUserAnalysisRightColumn = defaultAccordionRight.length > 0;

	if (analysisLoading) {
		return (
			<div className='px-4 py-4 pt-0 sm:px-6'>
				<div className='grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4'>
					<Skeleton variant={SkeletonVariant.Card} count={SKELETON_PLACEHOLDER_COUNTS.CARDS} />
				</div>
			</div>
		);
	}

	if (summaryError) {
		return (
			<div className='px-4 py-4 pt-0 sm:px-6'>
				<p className='text-sm text-destructive'>{t(AdminKey.FAILED_TO_LOAD_USER_ANALYTICS)}</p>
			</div>
		);
	}

	if (summaryData == null) {
		return (
			<div className='px-4 py-4 pt-0 sm:px-6'>
				<p className='text-sm text-muted-foreground'>{t(AdminKey.NO_ANALYTICS_FOR_USER)}</p>
			</div>
		);
	}

	return (
		<div className='space-y-4 px-4 py-4 pt-0 sm:px-6'>
			<div className={showUserAnalysisRightColumn ? 'grid grid-cols-1 gap-6 xl:grid-cols-2' : undefined}>
				<Accordion type='multiple' defaultValue={defaultAccordionLeft} className='min-w-0 w-full max-w-full'>
					<AccordionItem value={UserAnalysisAccordion.OVERVIEW}>
						<AccordionTrigger>{t(AdminKey.USER_ANALYSIS_SECTION_OVERVIEW)}</AccordionTrigger>
						<AccordionContent className='space-y-5'>
							<div className='grid grid-cols-1 gap-4 text-sm'>
								<div className='flex flex-wrap gap-x-6 gap-y-3'>
									<div className='flex items-center gap-1.5'>
										<span className='text-muted-foreground'>{t(AdminKey.USERS_TABLE_EMAIL)}</span>
										<span className='ml-2 font-medium'>{summaryData.user.email ?? EMPTY_VALUE}</span>
									</div>
									<div>
										<span className='text-muted-foreground'>{t(AdminKey.USERS_TABLE_USER_ID)}</span>
										<span className='ml-2 font-mono text-xs'>{summaryData.user.userId}</span>
									</div>
									<div>
										<span className='text-muted-foreground'>{t(AdminKey.CREDITS)}</span>
										<span className='ml-2 font-medium'>{summaryData.user.credits ?? 0}</span>
									</div>
									<div>
										<span className='text-muted-foreground'>{t(AdminKey.ACCOUNT_CREATED)}</span>
										<span className='ml-2'>{formatDate(summaryData.user.createdAt)}</span>
									</div>
								</div>
							</div>

							<div className='grid grid-cols-2 gap-3 sm:gap-4'>
								<StatCard
									stackIconLabel
									compact
									variant={StatCardVariant.CENTERED}
									icon={GamepadIcon}
									label={t(AdminKey.USERS_LABEL_TOTAL_GAMES)}
									value={formatNumericValue(summaryData.highlights.totalGames, 0)}
									color={SEMANTIC_ICON_TEXT.primary}
								/>
								<StatCard
									stackIconLabel
									compact
									variant={StatCardVariant.CENTERED}
									icon={Medal}
									label={t(AdminKey.USERS_LABEL_BEST_SCORE)}
									value={formatNumericValue(summaryData.highlights.bestScore, 0)}
									color={SEMANTIC_ICON_TEXT.success}
								/>
								{performanceData != null ? (
									<StatCard
										stackIconLabel
										compact
										variant={StatCardVariant.CENTERED}
										icon={TrendingUp}
										label={t(AdminKey.USERS_LABEL_STREAK_DAYS)}
										value={formatNumericValue(performanceData.streakDays, 0)}
										color={SEMANTIC_ICON_TEXT.secondary}
									/>
								) : null}
							</div>
						</AccordionContent>
					</AccordionItem>

					{statisticsData != null ? (
						<AccordionItem value={UserAnalysisAccordion.STATISTICS}>
							<AccordionTrigger>{t(AdminKey.USER_ANALYSIS_SECTION_STATISTICS)}</AccordionTrigger>
							<AccordionContent>
								<div className='grid grid-cols-2 gap-3 sm:gap-4'>
									<StatCard
										stackIconLabel
										compact
										variant={StatCardVariant.CENTERED}
										icon={Crosshair}
										label={t(AdminKey.USERS_LABEL_SUCCESS_RATE)}
										value={formatNumericValue(statisticsData.successRate, 1, '%')}
										color={SEMANTIC_ICON_TEXT.primary}
									/>
									<StatCard
										stackIconLabel
										compact
										variant={StatCardVariant.CENTERED}
										icon={FileQuestion}
										label={t(AdminKey.USERS_LABEL_QUESTIONS_ANSWERED)}
										value={formatNumericValue(statisticsData.totalQuestionsAnswered, 0)}
										color={SEMANTIC_ICON_TEXT.success}
									/>
									<StatCard
										stackIconLabel
										compact
										variant={StatCardVariant.CENTERED}
										icon={Target}
										label={t(AdminKey.USERS_LABEL_AVERAGE_SCORE)}
										value={formatNumericValue(statisticsData.averageScore, 0)}
										color={SEMANTIC_ICON_TEXT.warning}
									/>
									<StatCard
										stackIconLabel
										compact
										variant={StatCardVariant.CENTERED}
										icon={Clock}
										label={t(AdminKey.USERS_LABEL_TOTAL_PLAY_TIME)}
										value={formatNumericValue(statisticsData.totalPlayTime, 0)}
										suffix=' s'
										color={SEMANTIC_ICON_TEXT.secondary}
									/>
								</div>
							</AccordionContent>
						</AccordionItem>
					) : null}

					{performanceData != null ? (
						<AccordionItem value={UserAnalysisAccordion.PERFORMANCE}>
							<AccordionTrigger>{t(AdminKey.USER_ANALYSIS_SECTION_PERFORMANCE)}</AccordionTrigger>
							<AccordionContent>
								<div className='grid grid-cols-2 gap-3 sm:gap-4'>
									<StatCard
										stackIconLabel
										compact
										variant={StatCardVariant.CENTERED}
										icon={BookOpen}
										label={t(AdminKey.USERS_LABEL_STRONGEST_TOPIC)}
										value={formatTitle(performanceData.strongestTopic || EMPTY_VALUE)}
										color={SEMANTIC_ICON_TEXT.success}
									/>
									<StatCard
										stackIconLabel
										compact
										variant={StatCardVariant.CENTERED}
										icon={AlertCircle}
										label={t(AdminKey.USERS_LABEL_WEAKEST_TOPIC)}
										value={formatTitle(performanceData.weakestTopic || EMPTY_VALUE)}
										color={SEMANTIC_ICON_TEXT.warning}
									/>
									<StatCard
										stackIconLabel
										compact
										variant={StatCardVariant.CENTERED}
										icon={TrendingUp}
										label={t(AdminKey.USERS_LABEL_IMPROVEMENT_RATE)}
										value={formatNumericValue(performanceData.improvementRate, 2, '%')}
										color={SEMANTIC_ICON_TEXT.primary}
									/>
									<StatCard
										stackIconLabel
										compact
										variant={StatCardVariant.CENTERED}
										icon={Calendar}
										label={t(AdminKey.USERS_LABEL_LAST_PLAYED)}
										value={formatDate(performanceData.lastPlayed)}
										color={SEMANTIC_ICON_TEXT.secondary}
									/>
								</div>
							</AccordionContent>
						</AccordionItem>
					) : null}
				</Accordion>
				{showUserAnalysisRightColumn ? (
					<Accordion type='multiple' defaultValue={defaultAccordionRight} className='min-w-0 w-full max-w-full'>
						{hasInsightsBlock && insightsData != null ? (
							<AccordionItem value={UserAnalysisAccordion.INSIGHTS}>
								<AccordionTrigger>{t(AdminKey.INSIGHTS)}</AccordionTrigger>
								<AccordionContent>
									<div className='grid grid-cols-1 gap-4 text-sm sm:grid-cols-2'>
										{summaryData.highlights.topTopics != null && summaryData.highlights.topTopics.length > 0 ? (
											<div className='rounded-lg bg-muted/50 p-3 transition-colors hover-row sm:p-4'>
												<div className='mb-2 flex items-center gap-2'>
													<Tag
														className={cn('h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5', SEMANTIC_ICON_TEXT.primary)}
														strokeWidth={2.25}
													/>
													<span className='text-xs font-medium text-muted-foreground sm:text-sm'>
														{t(AdminKey.TOP_TOPICS)}
													</span>
												</div>
												<div className='flex flex-wrap gap-1.5'>
													{summaryData.highlights.topTopics.map(topic => (
														<span
															key={topic}
															className='inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium'
														>
															{formatTitle(topic)}
														</span>
													))}
												</div>
											</div>
										) : null}
										{insightsData.strengths != null && insightsData.strengths.length > 0 ? (
											<div className='rounded-lg bg-muted/50 p-3 transition-colors hover-row sm:p-4'>
												<div className='mb-2 flex items-center gap-2'>
													<Award
														className={cn('h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5', SEMANTIC_ICON_TEXT.success)}
														strokeWidth={2.25}
													/>
													<span className='text-xs font-medium text-green-600 dark:text-green-400 sm:text-sm'>
														{t(AdminKey.STRENGTHS)}
													</span>
												</div>
												<ul className='list-outside list-disc space-y-1 ps-4 text-xs leading-relaxed sm:text-sm'>
													{insightsData.strengths.map((s, i) => (
														<li key={`${s.kind}-${i}`}>{formatUserInsightLine(s, t)}</li>
													))}
												</ul>
											</div>
										) : null}
										{insightsData.improvements != null && insightsData.improvements.length > 0 ? (
											<div className='rounded-lg bg-muted/50 p-3 transition-colors hover-row sm:p-4'>
												<div className='mb-2 flex items-center gap-2'>
													<TrendingUp
														className={cn('h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5', SEMANTIC_ICON_TEXT.warning)}
														strokeWidth={2.25}
													/>
													<span className='text-xs font-medium text-amber-600 dark:text-amber-400 sm:text-sm'>
														{t(AdminKey.IMPROVEMENTS)}
													</span>
												</div>
												<ul className='list-outside list-disc space-y-1 ps-4 text-xs leading-relaxed sm:text-sm'>
													{insightsData.improvements.map((s, i) => (
														<li key={`${s.kind}-${i}`}>{formatUserInsightLine(s, t)}</li>
													))}
												</ul>
											</div>
										) : null}
										{insightsData.recentHighlights != null && insightsData.recentHighlights.length > 0 ? (
											<div className='rounded-lg bg-muted/50 p-3 transition-colors hover-row sm:p-4'>
												<div className='mb-2 flex items-center gap-2'>
													<CircleStar
														className={cn('h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5', SEMANTIC_ICON_TEXT.secondary)}
														strokeWidth={2.25}
													/>
													<span className='text-xs font-medium text-muted-foreground sm:text-sm'>
														{t(AdminKey.RECENT_HIGHLIGHTS)}
													</span>
												</div>
												<ul className='list-outside list-disc space-y-1 ps-4 text-xs leading-relaxed sm:text-sm'>
													{insightsData.recentHighlights.map((s, i) => (
														<li key={`${s.kind}-${i}`}>{formatUserInsightLine(s, t)}</li>
													))}
												</ul>
											</div>
										) : null}
									</div>
								</AccordionContent>
							</AccordionItem>
						) : null}
						{recommendationsData != null && recommendationsData.length > 0 ? (
							<AccordionItem value={UserAnalysisAccordion.RECOMMENDATIONS}>
								<AccordionTrigger>{t(AdminKey.RECOMMENDATIONS)}</AccordionTrigger>
								<AccordionContent>
									<div className='flex flex-wrap gap-3'>
										{recommendationsData.map(rec => {
											const copy = translateAdminRecommendation(rec, t);
											return (
												<div
													key={rec.id}
													className='min-w-0 max-w-full flex-1 basis-full rounded-md border p-3 text-xs sm:min-w-[200px] sm:max-w-[320px] sm:basis-[calc(50%-0.375rem)] sm:text-sm'
												>
													<div className='flex items-start justify-between gap-2'>
														<div className='min-w-0 flex-1 font-medium leading-snug'>{copy.title}</div>
														<span className='shrink-0 rounded-md border border-border px-2 py-0.5 text-[10px] font-medium uppercase text-muted-foreground sm:text-xs'>
															{translateRecommendationPriority(rec.priority, t)}
														</span>
													</div>
													{copy.description !== '' ? (
														<div className='mt-1 text-muted-foreground leading-relaxed'>{copy.description}</div>
													) : null}
													{copy.message !== '' ? (
														<p className='mt-2 text-foreground leading-relaxed'>{copy.message}</p>
													) : null}
													<div className='mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground sm:text-xs'>
														<span>
															<strong>{t(AdminKey.RECOMMENDATION_ACTION)}:</strong> {copy.action}
														</span>
														<span>
															<strong>{t(AdminKey.RECOMMENDATION_IMPACT)}:</strong> {copy.estimatedImpact}
														</span>
														<span>
															<strong>{t(AdminKey.RECOMMENDATION_EFFORT)}:</strong> {copy.implementationEffort}
														</span>
													</div>
												</div>
											);
										})}
									</div>
								</AccordionContent>
							</AccordionItem>
						) : null}
					</Accordion>
				) : null}
			</div>
		</div>
	);
});
