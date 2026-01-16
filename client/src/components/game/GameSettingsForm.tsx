import { AlertCircle, BookOpen, CheckSquare, Clock, FileQuestion, Hash, Star, Users } from 'lucide-react';

import {
	BASIC_TOPICS,
	CREDIT_COSTS,
	DifficultyLevel,
	GAME_MODES_CONFIG,
	GameMode as GameModeEnum,
	VALIDATION_COUNT,
} from '@shared/constants';
import { calculateRequiredCredits } from '@shared/utils';

import { ButtonSize, ButtonVariant, VariantBase } from '@/constants';
import { Alert, AlertDescription, Button, Input, Label, NumberInput, Textarea } from '@/components';
import { usePopularTopics, useUserAnalytics } from '@/hooks';
import type { GameSettingsFormProps } from '@/types';

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
	// Analytics hooks
	const { data: analytics } = useUserAnalytics();
	const { data: popularTopicsData } = usePopularTopics();

	// Extract user-specific topics
	const mostPlayedTopic = analytics?.game?.mostPlayedTopic;
	const topicsPlayed = analytics?.game?.topicsPlayed;
	const userTopics = topicsPlayed
		? Object.entries(topicsPlayed)
				.sort(([, a], [, b]) => b - a)
				.slice(0, 5)
				.map(([topic]) => topic)
		: [];

	// Extract popular topics from analytics data
	const popularTopics: string[] = popularTopicsData?.topics?.slice(0, 5).map(t => t.topic) ?? [];

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

				{/* Your Most Played Topic */}
				{mostPlayedTopic && mostPlayedTopic !== 'None' && (
					<div className='space-y-2'>
						<Label className='text-xs text-muted-foreground'>Your Most Played</Label>
						<Button
							type='button'
							variant={topic === mostPlayedTopic ? ButtonVariant.DEFAULT : ButtonVariant.OUTLINE}
							size={ButtonSize.SM}
							className='w-full justify-start bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/20'
							onClick={() => onTopicChange(topic === mostPlayedTopic ? '' : mostPlayedTopic)}
						>
							<Star className='h-3 w-3 mr-2 text-indigo-500' />
							{mostPlayedTopic}
						</Button>
					</div>
				)}

				{/* Your Topics */}
				{userTopics.length > 0 && (
					<div className='space-y-2'>
						<Label className='text-xs text-muted-foreground'>Your Topics</Label>
						<div className='flex flex-wrap gap-2'>
							{userTopics.map(t => {
								const gameCount = topicsPlayed?.[t] ?? 0;
								return (
									<Button
										key={t}
										type='button'
										variant={topic === t ? ButtonVariant.DEFAULT : ButtonVariant.OUTLINE}
										size={ButtonSize.SM}
										className='text-xs h-7'
										onClick={() => onTopicChange(topic === t ? '' : t)}
									>
										<BookOpen className='h-3 w-3 mr-1' />
										{t} ({gameCount} {gameCount === 1 ? 'game' : 'games'})
									</Button>
								);
							})}
						</div>
					</div>
				)}

				{/* Basic Topics */}
				<div className='space-y-2'>
					<Label className='text-xs text-muted-foreground'>Basic Topics</Label>
					<div className='flex flex-wrap gap-2'>
						{BASIC_TOPICS.map(t => (
							<Button
								key={t}
								type='button'
								variant={topic === t ? ButtonVariant.DEFAULT : ButtonVariant.OUTLINE}
								size={ButtonSize.SM}
								className='text-xs h-7'
								onClick={() => onTopicChange(topic === t ? '' : t)}
							>
								<BookOpen className='h-3 w-3 mr-1' />
								{t}
							</Button>
						))}
					</div>
				</div>

				{/* Popular Topics */}
				{popularTopics.length > 0 && (
					<div className='space-y-2'>
						<Label className='text-xs text-muted-foreground'>Popular Topics</Label>
						<div className='flex flex-wrap gap-2'>
							{popularTopics.map(t => (
								<Button
									key={t}
									type='button'
									variant={topic === t ? ButtonVariant.DEFAULT : ButtonVariant.OUTLINE}
									size={ButtonSize.SM}
									className='text-xs h-7'
									onClick={() => onTopicChange(topic === t ? '' : t)}
								>
									<BookOpen className='h-3 w-3 mr-1' />
									{t}
								</Button>
							))}
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
							{timeLimit < 60
								? `${timeLimit}s`
								: timeLimit < 3600
									? `${Math.floor(timeLimit / 60)}m`
									: `${Math.floor(timeLimit / 3600)}h`}
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
