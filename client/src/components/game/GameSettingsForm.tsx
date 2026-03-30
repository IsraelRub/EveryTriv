import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { cva } from 'class-variance-authority';
import { FileQuestion, Gauge, LayoutList, Tag, TimerReset, UserPlus } from 'lucide-react';

import { DIFFICULTY_CONFIG, DifficultyLevel, GAME_MODES_CONFIG, TIME_PERIODS_MS, VALIDATION_COUNT } from '@shared/constants';
import { namesMatch } from '@shared/utils';
import { matchesLocaleText } from '@shared/validation';

import {
	AlertVariant,
	ButtonSize,
	GameKey,
	isTopicBadgeType,
	TextLanguageStatus,
	TOPIC_BADGE_LABEL_KEYS,
	TOPIC_BADGE_META,
	TopicBadgeType,
	VariantBase,
} from '@/constants';
import type { GameSettingsFormProps, TopicWithMeta } from '@/types';
import { cn, formatTimeLimitDisplay, getDifficultyDisplayLabel } from '@/utils';
import {
	Alert,
	AlertDescription,
	Badge,
	Button,
	Input,
	Label,
	NumberInput,
	Textarea,
} from '@/components';
import { SurpriseMeDialog } from './surpriseMeDialog';
import { useAppSelector, usePopularTopics, useUserAnalytics } from '@/hooks';
import { selectLocale } from '@/redux/selectors';

const topicChipVariants = cva(
	'inline-flex items-center rounded-md border transition-colors h-auto py-1.5 gap-2 shrink-0',
	{
		variants: {
			type: {
				[TopicBadgeType.MOST_PLAYED]: 'w-full justify-start px-3 font-medium text-sm',
				[TopicBadgeType.BASIC]: 'text-xs px-2 gap-1.5',
				[TopicBadgeType.YOUR]: 'text-xs px-2 gap-1.5',
				[TopicBadgeType.POPULAR]: 'text-xs px-2 gap-1.5',
			},
			selected: {
				true: '',
				false: '',
			},
		},
		compoundVariants: [
			{
				selected: false,
				class: 'bg-muted/40 hover:bg-primary/20',
			},
		],
		defaultVariants: {
			type: TopicBadgeType.BASIC,
			selected: false,
		},
	}
);

export function GameSettingsForm({
	topic,
	onTopicChange,
	topicError,
	topicLanguageError,
	topicLanguageStatus,
	selectedDifficulty,
	onDifficultyChange,
	customDifficulty,
	onCustomDifficultyChange,
	customDifficultyError,
	onCustomDifficultyErrorChange,
	customDifficultyLanguageError,
	customDifficultyLanguageStatus,
	answerCount,
	onAnswerCountChange,
	selectedMode,
	maxQuestionsPerGame,
	onMaxQuestionsPerGameChange,
	timeLimit,
	onTimeLimitChange,
	maxPlayers,
	onMaxPlayersChange,
	showMaxPlayers = false,
}: GameSettingsFormProps): JSX.Element {
	const { t } = useTranslation('game');
	const locale = useAppSelector(selectLocale);
	const { data: analytics } = useUserAnalytics({ staleTime: TIME_PERIODS_MS.THIRTY_MINUTES, refetchOnMount: false });
	const { data: popularTopicsData } = usePopularTopics(undefined, { enabled: true });

	const answerCountInput = useMemo(
		() => (
			<NumberInput
				label={t(GameKey.ANSWER_CHOICES)}
				labelIcon={<LayoutList />}
				value={answerCount}
				onChange={onAnswerCountChange}
				min={VALIDATION_COUNT.ANSWER_COUNT.MIN}
				max={VALIDATION_COUNT.ANSWER_COUNT.MAX}
			/>
		),
		[t, answerCount, onAnswerCountChange]
	);

	// Memoize topic extraction to avoid recalculation
	// Limit to 3 topics per category to reduce UI clutter
	const { mostPlayedTopic, userTopics, popularTopics } = useMemo(() => {
		const mostPlayed = analytics?.game?.mostPlayedTopic;
		const topicsPlayed = analytics?.game?.topicsPlayed;
		const userTopicsList = topicsPlayed
			? Object.entries(topicsPlayed)
					.sort(([, a], [, b]) => b - a)
					.slice(0, 3)
					.map(([topic]) => topic)
			: [];
		const popularTopicsList: string[] = popularTopicsData?.topics?.slice(0, 3).map(t => t.topic) ?? [];

		return {
			mostPlayedTopic: mostPlayed,
			userTopics: userTopicsList,
			popularTopics: popularTopicsList,
		};
	}, [analytics?.game?.mostPlayedTopic, analytics?.game?.topicsPlayed, popularTopicsData?.topics]);

	// Memoize topics list construction
	const topicsList: TopicWithMeta[] = useMemo(() => {
		const topicsPlayed = analytics?.game?.topicsPlayed;
		const list: TopicWithMeta[] = [];
		const listHasName = (name: string) => list.some(t => namesMatch(t.name, name));
		const canShowTopic = (name: string) => matchesLocaleText(name, locale);

		// Add basic topics first (excluding duplicates); t(GameKey.BASIC_TOPICS, { returnObjects: true })
		const basicLabels = (() => {
			const raw = t(GameKey.BASIC_TOPICS, { returnObjects: true });
			return Array.isArray(raw)
				? raw.filter((value): value is string => typeof value === 'string' && canShowTopic(value))
				: [];
		})();
		basicLabels.forEach(name => {
			if (!listHasName(name)) {
				list.push({ name, type: TopicBadgeType.BASIC });
			}
		});

		// Add most played topic (if exists, excluding basic topics)
		if (mostPlayedTopic && canShowTopic(mostPlayedTopic)) {
			if (!listHasName(mostPlayedTopic)) {
				list.push({
					name: mostPlayedTopic,
					type: TopicBadgeType.MOST_PLAYED,
					gameCount: topicsPlayed?.[mostPlayedTopic],
				});
			}
		}

		// Add user topics (excluding most played and basic to avoid duplicates)
		userTopics.forEach(t => {
			if (canShowTopic(t) && !namesMatch(t, mostPlayedTopic ?? '') && !listHasName(t)) {
				list.push({
					name: t,
					type: TopicBadgeType.YOUR,
					gameCount: topicsPlayed?.[t],
				});
			}
		});

		// Add popular topics (excluding duplicates)
		popularTopics.forEach(t => {
			if (canShowTopic(t) && !listHasName(t)) {
				list.push({ name: t, type: TopicBadgeType.POPULAR });
			}
		});

		return list;
	}, [mostPlayedTopic, userTopics, popularTopics, analytics?.game?.topicsPlayed, locale, t]);

	// Determine visibility based on selectedMode or default behavior
	const shouldShowQuestionLimit = selectedMode ? GAME_MODES_CONFIG[selectedMode]?.showQuestionLimit : showMaxPlayers; // If multiplayer (showMaxPlayers=true), show question limit
	const shouldShowTimeLimit = selectedMode ? GAME_MODES_CONFIG[selectedMode]?.showTimeLimit : false; // Never show time limit in multiplayer

	const questionsLimitInput =
		shouldShowQuestionLimit && maxQuestionsPerGame !== undefined && onMaxQuestionsPerGameChange ? (
			<NumberInput
				label={t(GameKey.QUESTIONS_LABEL)}
				labelIcon={<FileQuestion />}
				value={maxQuestionsPerGame}
				onChange={onMaxQuestionsPerGameChange}
				min={VALIDATION_COUNT.QUESTIONS.MIN}
				max={VALIDATION_COUNT.QUESTIONS.MAX}
				step={VALIDATION_COUNT.QUESTIONS.STEP}
			/>
		) : null;

	return (
		<div className='space-y-6 py-4'>
			{/* Topic Selection */}
			<div className='space-y-3'>
				<Label className='flex items-center gap-2'>
					<Tag className='h-4 w-4 text-muted-foreground' />
					{t(GameKey.TOPIC)}
				</Label>
				<Input
					placeholder={t(GameKey.ENTER_TOPIC_OR_LEAVE_EMPTY)}
					value={topic}
					onChange={e => onTopicChange(e.target.value)}
				/>
				{topicError && (
					<Alert variant={AlertVariant.DESTRUCTIVE} className='py-2'>
						<AlertDescription className='text-xs'>{topicError}</AlertDescription>
					</Alert>
				)}
				{topicLanguageStatus === TextLanguageStatus.PENDING && (
					<p className='text-xs text-muted-foreground'>{t(GameKey.VALIDATING_SPELLING_AND_LANGUAGE)}</p>
				)}
				{topicLanguageError && topicLanguageStatus === TextLanguageStatus.INVALID && (
					<Alert variant={AlertVariant.DESTRUCTIVE} className='py-2'>
						<AlertDescription className='text-xs'>{topicLanguageError}</AlertDescription>
					</Alert>
				)}

				{/* Combined Topics List with Badges */}
				{topicsList.length > 0 && (
					<div className='space-y-3'>
						<Label className='text-xs text-muted-foreground'>{t(GameKey.SUGGESTED_TOPICS)}</Label>
						<div className='flex flex-col gap-2'>
							{topicsList
								.filter(t => t.type === TopicBadgeType.MOST_PLAYED)
								.map(({ name, type }) => {
									const isSelected = namesMatch(topic, name);
									const badge = isTopicBadgeType(type) ? (TOPIC_BADGE_META[type] ?? null) : null;
									const BadgeIcon = badge?.icon;
									const chipType: TopicBadgeType = isTopicBadgeType(type) ? type : TopicBadgeType.BASIC;
									return (
										<Button
											key={name}
											type='button'
											variant={isSelected ? VariantBase.DEFAULT : VariantBase.OUTLINE}
											size={ButtonSize.SM}
											className={topicChipVariants({ type: chipType, selected: isSelected })}
											onClick={() => onTopicChange(isSelected ? '' : name)}
										>
											<span className={type === TopicBadgeType.MOST_PLAYED ? 'font-medium text-sm' : 'text-xs'}>
												{name}
											</span>
											{badge && (
												<Badge
													variant={badge.variant}
													className={cn(
														'text-[10px] py-0 px-1.5 h-4 flex items-center gap-0.5',
														type === TopicBadgeType.MOST_PLAYED && 'ms-auto gap-1',
														badge.badgeClassName
													)}
												>
													{BadgeIcon && <BadgeIcon className={cn('h-2.5 w-2.5', badge.iconClassName)} />}
													{isTopicBadgeType(type) && TOPIC_BADGE_LABEL_KEYS[type]
														? t(TOPIC_BADGE_LABEL_KEYS[type])
														: badge?.label}
												</Badge>
											)}
										</Button>
									);
								})}
							<div className='flex flex-wrap gap-2'>
								{topicsList
									.filter(t => t.type !== TopicBadgeType.MOST_PLAYED)
									.map(({ name, type }) => {
										const isSelected = namesMatch(topic, name);
										const badge = isTopicBadgeType(type) ? (TOPIC_BADGE_META[type] ?? null) : null;
										const BadgeIcon = badge?.icon;
										const chipType: TopicBadgeType = isTopicBadgeType(type) ? type : TopicBadgeType.BASIC;
										return (
											<Button
												key={name}
												type='button'
												variant={isSelected ? VariantBase.DEFAULT : VariantBase.OUTLINE}
												size={ButtonSize.SM}
												className={topicChipVariants({ type: chipType, selected: isSelected })}
												onClick={() => onTopicChange(isSelected ? '' : name)}
											>
												<span className='text-xs'>{name}</span>
												{badge && (
													<Badge
														variant={badge.variant}
														className={cn(
															'text-[10px] py-0 px-1.5 h-4 flex items-center gap-0.5',
															badge.badgeClassName
														)}
													>
														{BadgeIcon && <BadgeIcon className={cn('h-2.5 w-2.5', badge.iconClassName)} />}
														{isTopicBadgeType(type) && TOPIC_BADGE_LABEL_KEYS[type]
															? t(TOPIC_BADGE_LABEL_KEYS[type])
															: badge?.label}
													</Badge>
												)}
											</Button>
										);
									})}
							</div>
						</div>
					</div>
				)}

				<SurpriseMeDialog
					onTopicChange={onTopicChange}
					onDifficultyChange={onDifficultyChange}
					onCustomDifficultyChange={onCustomDifficultyChange}
					onCustomDifficultyErrorChange={onCustomDifficultyErrorChange}
				/>
			</div>

			{/* Difficulty Selection */}
			<div className='space-y-3'>
				<Label className='flex items-center gap-2'>
					<Gauge className='h-4 w-4 text-muted-foreground' />
					{t(GameKey.DIFFICULTY)}
				</Label>
				<div className='grid grid-cols-4 gap-2'>
					{Object.values(DifficultyLevel)
						.sort((a, b) => (DIFFICULTY_CONFIG[a]?.order ?? 0) - (DIFFICULTY_CONFIG[b]?.order ?? 0))
						.flatMap(level => {
							const config = DIFFICULTY_CONFIG[level];
							return config ? [{ level, ...config }] : [];
						})
						.map(({ level, dotColor }) => {
							const isSelected = selectedDifficulty === level;
							return (
								<Button
									key={level}
									type='button'
									variant={isSelected ? VariantBase.DEFAULT : VariantBase.OUTLINE}
									size={ButtonSize.SM}
									onClick={() => onDifficultyChange(level)}
									className={cn(
										'flex items-center justify-center gap-2',
										!isSelected && 'bg-muted/40 hover:bg-primary/20'
									)}
								>
									<span className={cn('w-2 h-2 rounded-full', dotColor)} />
									{getDifficultyDisplayLabel(level, t)}
								</Button>
							);
						})}
				</div>
				{/* Custom Difficulty Input */}
				{selectedDifficulty === DifficultyLevel.CUSTOM && (
					<div className='space-y-2'>
						<Textarea
							placeholder={t(GameKey.CUSTOM_DIFFICULTY_PLACEHOLDER)}
							value={customDifficulty}
							onChange={e => {
								onCustomDifficultyChange(e.target.value);
								// Clear error when user starts typing
								if (customDifficultyError) {
									onCustomDifficultyErrorChange('');
								}
							}}
							className='min-h-[80px]'
						/>
						{customDifficultyError && (
							<Alert variant={AlertVariant.DESTRUCTIVE} className='py-2'>
								<AlertDescription className='text-xs'>{customDifficultyError}</AlertDescription>
							</Alert>
						)}
						{customDifficultyLanguageStatus === TextLanguageStatus.PENDING && (
							<p className='text-xs text-muted-foreground'>{t(GameKey.VALIDATING_SPELLING_AND_LANGUAGE)}</p>
						)}
						{customDifficultyLanguageError && customDifficultyLanguageStatus === TextLanguageStatus.INVALID && (
							<Alert variant={AlertVariant.DESTRUCTIVE} className='py-2'>
								<AlertDescription className='text-xs'>{customDifficultyLanguageError}</AlertDescription>
							</Alert>
						)}
						<p className='text-xs text-muted-foreground'>{t(GameKey.AI_WILL_GENERATE_QUESTIONS)}</p>
					</div>
				)}
			</div>

			{/* Settings Grid - Questions/Time, Answer Count, Max Players */}
			{showMaxPlayers ? (
				/* Multiplayer: three number inputs in one row, evenly distributed */
				<div className='flex flex-col sm:flex-row gap-4 sm:justify-evenly'>
					{questionsLimitInput}
					{answerCountInput}
					{maxPlayers !== undefined && onMaxPlayersChange && (
						<NumberInput
							label={t(GameKey.MAX_PLAYERS)}
							labelIcon={<UserPlus />}
							value={maxPlayers}
							onChange={onMaxPlayersChange}
							min={VALIDATION_COUNT.PLAYERS.MIN}
							max={VALIDATION_COUNT.PLAYERS.MAX}
						/>
					)}
				</div>
			) : (
				<div className='flex flex-col sm:flex-row flex-wrap gap-4 sm:justify-evenly'>
					{questionsLimitInput}

					{/* Time Limit */}
					{shouldShowTimeLimit && timeLimit !== undefined && onTimeLimitChange && (
						<div className='flex flex-col items-center space-y-3'>
							<NumberInput
								label={t(GameKey.TIME_LIMIT_SECONDS)}
								labelIcon={<TimerReset />}
								value={timeLimit}
								onChange={onTimeLimitChange}
								min={VALIDATION_COUNT.TIME_LIMIT.MIN}
								max={VALIDATION_COUNT.TIME_LIMIT.MAX}
								step={VALIDATION_COUNT.TIME_LIMIT.STEP}
							/>
							<p className='text-xs text-muted-foreground text-center'>{formatTimeLimitDisplay(timeLimit)}</p>
						</div>
					)}

					{/* Answer Count Selection - Always shown */}
					{answerCountInput}
				</div>
			)}
		</div>
	);
}
