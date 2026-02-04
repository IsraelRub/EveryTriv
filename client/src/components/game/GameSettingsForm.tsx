import { useMemo } from 'react';
import { AlertCircle, CheckSquare, Clock, FileQuestion, Flame, Hash, Layers, Star, User, Users } from 'lucide-react';

import {
	BASIC_TOPICS,
	CREDIT_COSTS,
	DifficultyLevel,
	GAME_MODES_CONFIG,
	GameMode as GameModeEnum,
	TIME_DURATIONS_SECONDS,
	TIME_PERIODS_MS,
	VALIDATION_COUNT,
} from '@shared/constants';
import { calculateRequiredCredits } from '@shared/utils';

import { ButtonSize, ButtonVariant, VariantBase } from '@/constants';
import { Alert, AlertDescription, Badge, Button, Input, Label, NumberInput, Textarea } from '@/components';
import { usePopularTopics, useUserAnalytics } from '@/hooks';
import type { GameSettingsFormProps } from '@/types';
import { cn } from '@/utils';

export function GameSettingsForm({
	topic,
	onTopicChange,
	topicError,
	selectedDifficulty,
	onDifficultyChange,
	customDifficulty,
	onCustomDifficultyChange,
	customDifficultyError,
	onCustomDifficultyErrorChange,
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
	const { data: analytics } = useUserAnalytics({ staleTime: TIME_PERIODS_MS.THIRTY_MINUTES, refetchOnMount: false });
	const { data: popularTopicsData } = usePopularTopics(undefined, { enabled: true });

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
	type TopicWithMeta = {
		name: string;
		type: 'most-played' | 'yours' | 'basic' | 'popular';
		gameCount?: number;
	};

	const topicsList: TopicWithMeta[] = useMemo(() => {
		const topicsPlayed = analytics?.game?.topicsPlayed;
		const list: TopicWithMeta[] = [];

		// Add basic topics first (excluding duplicates)
		BASIC_TOPICS.forEach(t => {
			if (!list.some(topic => topic.name === t)) {
				list.push({ name: t, type: 'basic' });
			}
		});

		// Add most played topic (if exists, excluding basic topics)
		if (mostPlayedTopic && mostPlayedTopic !== 'None') {
			if (!list.some(topic => topic.name === mostPlayedTopic)) {
				list.push({
					name: mostPlayedTopic,
					type: 'most-played',
					gameCount: topicsPlayed?.[mostPlayedTopic],
				});
			}
		}

		// Add user topics (excluding most played and basic to avoid duplicates)
		userTopics.forEach(t => {
			if (t !== mostPlayedTopic && !list.some(topic => topic.name === t)) {
				list.push({
					name: t,
					type: 'yours',
					gameCount: topicsPlayed?.[t],
				});
			}
		});

		// Add popular topics (excluding duplicates)
		popularTopics.forEach(t => {
			if (!list.some(topic => topic.name === t)) {
				list.push({ name: t, type: 'popular' });
			}
		});

		return list;
	}, [mostPlayedTopic, userTopics, popularTopics, analytics?.game?.topicsPlayed]);

	// Determine visibility based on selectedMode or default behavior
	const shouldShowQuestionLimit = selectedMode ? GAME_MODES_CONFIG[selectedMode]?.showQuestionLimit : showMaxPlayers; // If multiplayer (showMaxPlayers=true), show question limit
	const shouldShowTimeLimit = selectedMode ? GAME_MODES_CONFIG[selectedMode]?.showTimeLimit : false; // Never show time limit in multiplayer

	return (
		<div className='space-y-6 py-4'>
			{/* Topic Selection */}
			<div className='space-y-3'>
				<Label className='flex items-center gap-2'>
					<Hash className='h-4 w-4 text-muted-foreground' />
					Topic
				</Label>
				<Input
					placeholder='Enter a topic or leave empty for random...'
					value={topic}
					onChange={e => onTopicChange(e.target.value)}
				/>
				{topicError && (
					<Alert variant={VariantBase.DESTRUCTIVE} className='py-2'>
						<AlertCircle className='h-4 w-4' />
						<AlertDescription className='text-xs'>{topicError}</AlertDescription>
					</Alert>
				)}

				{/* Combined Topics List with Badges */}
				{topicsList.length > 0 && (
					<div className='space-y-3'>
						<Label className='text-xs text-muted-foreground'>Suggested Topics</Label>
						<div className='flex flex-col gap-2'>
							{/* Most Played - Highlighted separately */}
							{topicsList
								.filter(t => t.type === 'most-played')
								.map(({ name }) => {
									const isSelected = topic === name;
									return (
										<Button
											key={name}
											type='button'
											variant={isSelected ? ButtonVariant.DEFAULT : ButtonVariant.OUTLINE}
											size={ButtonSize.SM}
											className='w-full justify-start h-auto py-1.5 px-3 gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/30'
											onClick={() => onTopicChange(isSelected ? '' : name)}
										>
											<Star className='h-3.5 w-3.5 text-indigo-500' />
											<span className='font-medium text-sm'>{name}</span>
											<Badge
												variant={VariantBase.DEFAULT}
												className='text-[10px] py-0 px-1.5 h-4 ml-auto flex items-center gap-1'
											>
												<Star className='h-2.5 w-2.5' />
												Your Top
											</Badge>
										</Button>
									);
								})}

							{/* Other Topics - In a grid */}
							<div className='flex flex-wrap gap-2'>
								{topicsList
									.filter(t => t.type !== 'most-played')
									.map(({ name, type }) => {
										const isSelected = topic === name;
										type BadgeConfigType = {
											label: string;
											variant: VariantBase;
											icon: typeof User;
											buttonClassName?: string;
											iconClassName?: string;
										};

										const getBadgeConfig = (): BadgeConfigType => {
											switch (type) {
												case 'yours':
													return {
														label: 'Your',
														variant: VariantBase.SECONDARY,
														icon: User,
													};
												case 'basic':
													return {
														label: 'Basic',
														variant: VariantBase.OUTLINE,
														icon: Layers,
													};
												case 'popular':
													return {
														label: 'Popular',
														variant: VariantBase.SECONDARY,
														icon: Flame,
														buttonClassName: 'bg-teal-500/10 hover:bg-teal-500/20 border-teal-500/30',
														iconClassName: 'text-white',
													};
												default:
													return {
														label: '',
														variant: VariantBase.OUTLINE,
														icon: Layers,
													};
											}
										};

										const badgeConfig = getBadgeConfig();
										const BadgeIcon = badgeConfig.icon;
										const showBadge = type !== 'basic';

										return (
											<Button
												key={name}
												type='button'
												variant={isSelected ? ButtonVariant.DEFAULT : ButtonVariant.OUTLINE}
												size={ButtonSize.SM}
												className={cn('text-xs h-auto py-1.5 px-2 gap-1.5', badgeConfig.buttonClassName)}
												onClick={() => onTopicChange(isSelected ? '' : name)}
											>
												{showBadge && <BadgeIcon className={cn('h-3 w-3', badgeConfig.iconClassName)} />}
												<span className='text-xs'>{name}</span>
												{showBadge && (
													<Badge
														variant={badgeConfig.variant}
														className='text-[10px] py-0 px-1.5 h-4 flex items-center gap-0.5'
													>
														<BadgeIcon className={cn('h-2.5 w-2.5', badgeConfig.iconClassName)} />
														{badgeConfig.label}
													</Badge>
												)}
											</Button>
										);
									})}
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Difficulty Selection */}
			<div className='space-y-3'>
				<Label className='flex items-center gap-2'>
					<AlertCircle className='h-4 w-4 text-muted-foreground' />
					Difficulty
				</Label>
				<div className='grid grid-cols-4 gap-2'>
					<Button
						type='button'
						variant={selectedDifficulty === DifficultyLevel.EASY ? ButtonVariant.DEFAULT : ButtonVariant.OUTLINE}
						size={ButtonSize.SM}
						onClick={() => onDifficultyChange(DifficultyLevel.EASY)}
						className='flex items-center justify-center gap-2'
					>
						<span className='w-2 h-2 rounded-full bg-green-500' />
						Easy
					</Button>
					<Button
						type='button'
						variant={selectedDifficulty === DifficultyLevel.MEDIUM ? ButtonVariant.DEFAULT : ButtonVariant.OUTLINE}
						size={ButtonSize.SM}
						onClick={() => onDifficultyChange(DifficultyLevel.MEDIUM)}
						className='flex items-center justify-center gap-2'
					>
						<span className='w-2 h-2 rounded-full bg-yellow-500' />
						Medium
					</Button>
					<Button
						type='button'
						variant={selectedDifficulty === DifficultyLevel.HARD ? ButtonVariant.DEFAULT : ButtonVariant.OUTLINE}
						size={ButtonSize.SM}
						onClick={() => onDifficultyChange(DifficultyLevel.HARD)}
						className='flex items-center justify-center gap-2'
					>
						<span className='w-2 h-2 rounded-full bg-red-500' />
						Hard
					</Button>
					<Button
						type='button'
						variant={selectedDifficulty === DifficultyLevel.CUSTOM ? ButtonVariant.DEFAULT : ButtonVariant.OUTLINE}
						size={ButtonSize.SM}
						onClick={() => onDifficultyChange(DifficultyLevel.CUSTOM)}
						className='flex items-center justify-center gap-2'
					>
						<span className='w-2 h-2 rounded-full bg-purple-500' />
						Custom
					</Button>
				</div>
				{/* Custom Difficulty Input */}
				{selectedDifficulty === DifficultyLevel.CUSTOM && (
					<div className='space-y-2'>
						<Textarea
							placeholder="Describe your custom difficulty...&#10;Example: 'Questions about advanced quantum physics for PhD students'"
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
							<Alert variant={VariantBase.DESTRUCTIVE} className='py-2'>
								<AlertCircle className='h-4 w-4' />
								<AlertDescription className='text-xs'>{customDifficultyError}</AlertDescription>
							</Alert>
						)}
						<p className='text-xs text-muted-foreground'>The AI will generate questions based on your description</p>
					</div>
				)}
			</div>

			{/* Settings Grid - Questions/Time, Answer Count, Max Players */}
			<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
				{/* Question Limit */}
				{shouldShowQuestionLimit && maxQuestionsPerGame !== undefined && onMaxQuestionsPerGameChange && (
					<div className='space-y-3'>
						<Label className='flex items-center gap-2'>
							<FileQuestion className='h-4 w-4 text-muted-foreground' />
							Number of Questions
						</Label>
						<div className='flex justify-start'>
							<NumberInput
								value={maxQuestionsPerGame}
								onChange={onMaxQuestionsPerGameChange}
								min={VALIDATION_COUNT.QUESTIONS.MIN}
								max={VALIDATION_COUNT.QUESTIONS.MAX}
								step={VALIDATION_COUNT.QUESTIONS.STEP}
							/>
						</div>
						{selectedMode && (
							<p className='text-xs text-muted-foreground'>
								= {calculateRequiredCredits(maxQuestionsPerGame, selectedMode)} credits
							</p>
						)}
					</div>
				)}

				{/* Time Limit */}
				{shouldShowTimeLimit && timeLimit !== undefined && onTimeLimitChange && (
					<div className='space-y-3'>
						<Label className='flex items-center gap-2'>
							<Clock className='h-4 w-4 text-muted-foreground' />
							Time Limit (seconds)
						</Label>
						<div className='flex justify-start'>
							<NumberInput
								value={timeLimit}
								onChange={onTimeLimitChange}
								min={VALIDATION_COUNT.TIME_LIMIT.MIN}
								max={VALIDATION_COUNT.TIME_LIMIT.MAX}
								step={VALIDATION_COUNT.TIME_LIMIT.STEP}
							/>
						</div>
						<p className='text-xs text-muted-foreground'>
							{timeLimit < TIME_DURATIONS_SECONDS.MINUTE
								? `${timeLimit}s`
								: timeLimit < TIME_DURATIONS_SECONDS.HOUR
									? `${Math.floor(timeLimit / TIME_DURATIONS_SECONDS.MINUTE)}m`
									: `${Math.floor(timeLimit / TIME_DURATIONS_SECONDS.HOUR)}h`}
							{selectedMode && (
								<span className='ml-2'>• Fixed cost: {CREDIT_COSTS[selectedMode]?.fixedCost ?? 10} credits</span>
							)}
						</p>
					</div>
				)}

				{/* Answer Count Selection - Always shown */}
				<div className='space-y-3'>
					<Label className='flex items-center gap-2'>
						<CheckSquare className='h-4 w-4 text-muted-foreground' />
						Number of Answer Choices
					</Label>
					<div className='flex justify-start'>
						<NumberInput
							value={answerCount}
							onChange={onAnswerCountChange}
							min={VALIDATION_COUNT.ANSWER_COUNT.MIN}
							max={VALIDATION_COUNT.ANSWER_COUNT.MAX}
							step={VALIDATION_COUNT.ANSWER_COUNT.STEP}
						/>
					</div>
				</div>

				{/* Max Players (for multiplayer) */}
				{showMaxPlayers && maxPlayers !== undefined && onMaxPlayersChange && (
					<div className='space-y-3'>
						<Label className='flex items-center gap-2'>
							<Users className='h-4 w-4 text-muted-foreground' />
							Max Players
						</Label>
						<div className='flex justify-start'>
							<NumberInput
								value={maxPlayers}
								onChange={onMaxPlayersChange}
								min={VALIDATION_COUNT.PLAYERS.MIN}
								max={VALIDATION_COUNT.PLAYERS.MAX}
								step={1}
							/>
						</div>
					</div>
				)}
			</div>

			{/* Unlimited Mode Info */}
			{selectedMode === GameModeEnum.UNLIMITED && (
				<div className='p-4 rounded-lg bg-muted/50 text-center'>
					<p className='text-sm text-muted-foreground'>
						Play until your credits run out. Each question costs 1 credit.
					</p>
				</div>
			)}
		</div>
	);
}
