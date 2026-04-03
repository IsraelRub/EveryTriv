import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
	AlertCircle,
	Award,
	BarChart3,
	BookOpen,
	Calendar,
	CircleStar,
	Clock,
	GamepadIcon,
	HelpCircle,
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
import { cn } from '@/utils';
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

	const defaultOpenSections = useMemo((): UserAnalysisAccordion[] => {
		const keys: UserAnalysisAccordion[] = [UserAnalysisAccordion.OVERVIEW];
		if (statisticsData != null) keys.push(UserAnalysisAccordion.STATISTICS);
		if (performanceData != null) keys.push(UserAnalysisAccordion.PERFORMANCE);
		if (hasInsightsBlock) keys.push(UserAnalysisAccordion.INSIGHTS);
		if ((recommendationsData?.length ?? 0) > 0) keys.push(UserAnalysisAccordion.RECOMMENDATIONS);
		return keys;
	}, [statisticsData, performanceData, hasInsightsBlock, recommendationsData]);

	if (analysisLoading) {
		return (
			<div className='p-4 pt-0'>
				<div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
					<Skeleton variant={SkeletonVariant.Card} count={SKELETON_PLACEHOLDER_COUNTS.CARDS} />
				</div>
			</div>
		);
	}

	if (summaryError) {
		return (
			<div className='p-4 pt-0'>
				<p className='text-sm text-destructive'>{t(AdminKey.FAILED_TO_LOAD_USER_ANALYTICS)}</p>
			</div>
		);
	}

	if (summaryData == null) {
		return (
			<div className='p-4 pt-0'>
				<p className='text-sm text-muted-foreground'>{t(AdminKey.NO_ANALYTICS_FOR_USER)}</p>
			</div>
		);
	}

	return (
		<div className='space-y-3 p-4 pt-0'>
			<Accordion type='multiple' defaultValue={defaultOpenSections} className='w-full'>
				<AccordionItem value={UserAnalysisAccordion.OVERVIEW}>
					<AccordionTrigger>{t(AdminKey.USER_ANALYSIS_SECTION_OVERVIEW)}</AccordionTrigger>
					<AccordionContent className='space-y-4'>
						<div className='grid grid-cols-1 gap-4 text-sm'>
							<div className='flex flex-wrap gap-6'>
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

						<div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
							<StatCard
								variant={StatCardVariant.CENTERED}
								icon={GamepadIcon}
								label={t(AdminKey.USERS_LABEL_TOTAL_GAMES)}
								value={formatNumericValue(summaryData.highlights.totalGames, 0)}
								color={SEMANTIC_ICON_TEXT.primary}
							/>
							<StatCard
								variant={StatCardVariant.CENTERED}
								icon={Medal}
								label={t(AdminKey.USERS_LABEL_BEST_SCORE)}
								value={formatNumericValue(summaryData.highlights.bestScore, 0)}
								color={SEMANTIC_ICON_TEXT.success}
							/>
							{performanceData != null ? (
								<StatCard
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
							<div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
								<StatCard
									variant={StatCardVariant.CENTERED}
									icon={BarChart3}
									label={t(AdminKey.USERS_LABEL_SUCCESS_RATE)}
									value={formatNumericValue(statisticsData.successRate, 1, '%')}
									color={SEMANTIC_ICON_TEXT.primary}
								/>
								<StatCard
									variant={StatCardVariant.CENTERED}
									icon={HelpCircle}
									label={t(AdminKey.USERS_LABEL_QUESTIONS_ANSWERED)}
									value={formatNumericValue(statisticsData.totalQuestionsAnswered, 0)}
									color={SEMANTIC_ICON_TEXT.success}
								/>
								<StatCard
									variant={StatCardVariant.CENTERED}
									icon={Target}
									label={t(AdminKey.USERS_LABEL_AVERAGE_SCORE)}
									value={formatNumericValue(statisticsData.averageScore, 0)}
									color={SEMANTIC_ICON_TEXT.warning}
								/>
								<StatCard
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
							<div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
								<StatCard
									variant={StatCardVariant.CENTERED}
									icon={BookOpen}
									label={t(AdminKey.USERS_LABEL_STRONGEST_TOPIC)}
									value={formatTitle(performanceData.strongestTopic || EMPTY_VALUE)}
									color={SEMANTIC_ICON_TEXT.success}
								/>
								<StatCard
									variant={StatCardVariant.CENTERED}
									icon={AlertCircle}
									label={t(AdminKey.USERS_LABEL_WEAKEST_TOPIC)}
									value={formatTitle(performanceData.weakestTopic || EMPTY_VALUE)}
									color={SEMANTIC_ICON_TEXT.warning}
								/>
								<StatCard
									variant={StatCardVariant.CENTERED}
									icon={TrendingUp}
									label={t(AdminKey.USERS_LABEL_IMPROVEMENT_RATE)}
									value={formatNumericValue(performanceData.improvementRate, 2, '%')}
									color={SEMANTIC_ICON_TEXT.primary}
								/>
								<StatCard
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

				{hasInsightsBlock && insightsData != null ? (
					<AccordionItem value={UserAnalysisAccordion.INSIGHTS}>
						<AccordionTrigger>{t(AdminKey.INSIGHTS)}</AccordionTrigger>
						<AccordionContent>
							<div className='grid grid-cols-1 gap-4 text-sm md:grid-cols-2 lg:grid-cols-4'>
								{summaryData.highlights.topTopics != null && summaryData.highlights.topTopics.length > 0 ? (
									<div className='rounded-lg bg-muted/50 p-4 transition-colors hover-row'>
										<div className='mb-2 flex items-center gap-2'>
											<Tag className={cn('h-5 w-5 flex-shrink-0', SEMANTIC_ICON_TEXT.primary)} strokeWidth={2.25} />
											<span className='font-medium text-muted-foreground'>{t(AdminKey.TOP_TOPICS)}</span>
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
									<div className='rounded-lg bg-muted/50 p-4 transition-colors hover-row'>
										<div className='mb-2 flex items-center gap-2'>
											<Award className={cn('h-5 w-5 flex-shrink-0', SEMANTIC_ICON_TEXT.success)} strokeWidth={2.25} />
											<span className='font-medium text-green-600 dark:text-green-400'>{t(AdminKey.STRENGTHS)}</span>
										</div>
										<ul className='list-inside list-disc space-y-0.5'>
											{insightsData.strengths.map((s, i) => (
												<li key={i}>{s}</li>
											))}
										</ul>
									</div>
								) : null}
								{insightsData.improvements != null && insightsData.improvements.length > 0 ? (
									<div className='rounded-lg bg-muted/50 p-4 transition-colors hover-row'>
										<div className='mb-2 flex items-center gap-2'>
											<TrendingUp
												className={cn('h-5 w-5 flex-shrink-0', SEMANTIC_ICON_TEXT.warning)}
												strokeWidth={2.25}
											/>
											<span className='font-medium text-amber-600 dark:text-amber-400'>{t(AdminKey.IMPROVEMENTS)}</span>
										</div>
										<ul className='list-inside list-disc space-y-0.5'>
											{insightsData.improvements.map((s, i) => (
												<li key={i}>{s}</li>
											))}
										</ul>
									</div>
								) : null}
								{insightsData.recentHighlights != null && insightsData.recentHighlights.length > 0 ? (
									<div className='rounded-lg bg-muted/50 p-4 transition-colors hover-row'>
										<div className='mb-2 flex items-center gap-2'>
											<CircleStar
												className={cn('h-5 w-5 flex-shrink-0', SEMANTIC_ICON_TEXT.secondary)}
												strokeWidth={2.25}
											/>
											<span className='font-medium text-muted-foreground'>{t(AdminKey.RECENT_HIGHLIGHTS)}</span>
										</div>
										<ul className='list-inside list-disc space-y-0.5'>
											{insightsData.recentHighlights.map((s, i) => (
												<li key={i}>{s}</li>
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
							<div className='flex flex-wrap gap-2'>
								{recommendationsData.map(rec => (
									<div key={rec.id} className='min-w-[200px] max-w-[320px] flex-1 rounded-md border p-3 text-sm'>
										<div className='font-medium'>{rec.title}</div>
										{rec.description != null && rec.description !== '' ? (
											<div className='mt-1 text-muted-foreground'>{rec.description}</div>
										) : null}
									</div>
								))}
							</div>
						</AccordionContent>
					</AccordionItem>
				) : null}
			</Accordion>
		</div>
	);
});
