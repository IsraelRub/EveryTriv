import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { motion } from 'framer-motion';
import {
	AlertCircle,
	BookOpen,
	CheckSquare,
	Clock,
	CreditCard,
	Crown,
	FileQuestion,
	Hash,
	Infinity,
	ListOrdered,
	Star,
} from 'lucide-react';

import {
	CUSTOM_DIFFICULTY_PREFIX,
	DifficultyLevel,
	GAME_MODES_CONFIG,
	GAME_STATE_CONFIG,
	GameMode as GameModeEnum,
	UserRole,
	VALIDATION_CONFIG,
} from '@shared/constants';
import type { GameDifficulty } from '@shared/types';
import { validateCustomDifficultyText } from '@shared/validation';

import { ButtonSize, ButtonVariant, POPULAR_TOPICS, ROUTES, SCORING_DEFAULTS, VariantBase } from '@/constants';

import {
	Alert,
	AlertDescription,
	Badge,
	Button,
	Card,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	NumberInput,
	Textarea,
} from '@/components';

import { useAppSelector, useCanPlay, usePopularTopics, useUserAnalytics } from '@/hooks';

import type { GameConfig, GameModeOption } from '@/types';

import { formatTimeDisplay } from '@/utils';

import { selectUserRole } from '@/redux/selectors';

// Icon mapping for game modes
const GAME_MODE_ICONS: Record<GameModeEnum, typeof ListOrdered | typeof Clock | typeof Infinity> = {
	[GameModeEnum.QUESTION_LIMITED]: ListOrdered,
	[GameModeEnum.TIME_LIMITED]: Clock,
	[GameModeEnum.UNLIMITED]: Infinity,
	[GameModeEnum.MULTIPLAYER]: Clock,
} as const;

// Generate game modes array from GAME_MODES_CONFIG
const isGameMode = (key: string): key is GameModeEnum => {
	return Object.values(GameModeEnum).some(mode => mode === key);
};

const GAME_MODES: [GameModeEnum, GameModeOption][] = Object.keys(GAME_MODES_CONFIG)
	.filter(isGameMode)
	.filter(mode => mode !== GameModeEnum.MULTIPLAYER)
	.map(mode => [
		mode,
		{
			name: GAME_MODES_CONFIG[mode].name,
			description: GAME_MODES_CONFIG[mode].description,
			icon: GAME_MODE_ICONS[mode],
			showQuestionLimit: GAME_MODES_CONFIG[mode].showQuestionLimit,
			showTimeLimit: GAME_MODES_CONFIG[mode].showTimeLimit,
		},
	]);

export function GameMode({
	onModeSelect,
}: {
	onModeSelect?: (mode: GameModeEnum, settings?: GameConfig) => void;
}): JSX.Element {
	const navigate = useNavigate();
	const [selectedMode, setSelectedMode] = useState<GameModeEnum | null>(null);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [noCreditsDialogOpen, setNoCreditsDialogOpen] = useState(false);

	// Settings state
	const [topic, setTopic] = useState<string>(GAME_STATE_CONFIG.defaults.topic);
	const [maxQuestionsPerGame, setMaxQuestionsPerGame] = useState<number>(
		GAME_MODES_CONFIG[GameModeEnum.QUESTION_LIMITED].defaults.maxQuestionsPerGame ?? 10
	);
	const [timeLimit, setTimeLimit] = useState<number>(
		GAME_MODES_CONFIG[GameModeEnum.TIME_LIMITED].defaults.timeLimit ?? 60
	);
	const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>(DifficultyLevel.MEDIUM);
	const [customDifficulty, setCustomDifficulty] = useState('');
	const [customDifficultyError, setCustomDifficultyError] = useState<string>('');
	const [answerCount, setAnswerCount] = useState<number>(SCORING_DEFAULTS.ANSWER_COUNT);

	// Credit check
	const userRole = useAppSelector(selectUserRole);
	const isAdmin = userRole === UserRole.ADMIN;
	// Calculate the correct question count for credit check
	// Convert undefined to UNLIMITED (-1) for API (canPlay needs a number)
	const creditCheckQuestionLimit =
		selectedMode && GAME_MODES_CONFIG[selectedMode].showQuestionLimit
			? maxQuestionsPerGame
			: VALIDATION_CONFIG.limits.QUESTIONS.UNLIMITED;
	const { data: canPlay } = useCanPlay(creditCheckQuestionLimit, selectedMode ?? GameModeEnum.QUESTION_LIMITED);

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

	// Extract popular topics
	const popularTopics: string[] = popularTopicsData?.topics?.slice(0, 5).map(t => t.topic) || [
		...POPULAR_TOPICS.slice(0, 5),
	];

	const handleModeClick = (mode: GameModeEnum) => {
		// Set default values based on mode
		const defaults = GAME_MODES_CONFIG[mode].defaults;
		// Only update maxQuestionsPerGame if it's defined (not undefined) and showQuestionLimit is true
		if (defaults.maxQuestionsPerGame !== undefined && defaults.maxQuestionsPerGame !== null) {
			setMaxQuestionsPerGame(defaults.maxQuestionsPerGame);
		}
		if (defaults.timeLimit) {
			setTimeLimit(defaults.timeLimit);
		}

		// Reset form
		setTopic(GAME_STATE_CONFIG.defaults.topic);
		setSelectedDifficulty(DifficultyLevel.MEDIUM);
		setCustomDifficulty('');
		setCustomDifficultyError('');
		setAnswerCount(SCORING_DEFAULTS.ANSWER_COUNT);

		setSelectedMode(mode);
		setDialogOpen(true);
	};

	const handleStartGame = () => {
		if (!selectedMode) return;

		// Check if user has enough credits (admins are always allowed)
		if (!isAdmin && !canPlay) {
			setDialogOpen(false);
			setNoCreditsDialogOpen(true);
			return;
		}

		// Validate custom difficulty if selected
		if (selectedDifficulty === DifficultyLevel.CUSTOM) {
			const trimmedCustomDifficulty = customDifficulty.trim();
			const validation = validateCustomDifficultyText(trimmedCustomDifficulty);

			if (!validation.isValid) {
				setCustomDifficultyError(validation.errors[0] || 'Invalid custom difficulty');
				return;
			}

			setCustomDifficultyError('');
		}

		// Format custom difficulty with prefix, or use standard difficulty
		let finalDifficulty: GameDifficulty;
		if (selectedDifficulty === DifficultyLevel.CUSTOM) {
			finalDifficulty = customDifficulty.trim()
				? `${CUSTOM_DIFFICULTY_PREFIX}${customDifficulty.trim()}`
				: DifficultyLevel.MEDIUM;
		} else {
			finalDifficulty = selectedDifficulty;
		}

		const modeConfig = GAME_MODES_CONFIG[selectedMode];
		const settings: GameConfig = {
			mode: selectedMode,
			difficulty: finalDifficulty,
			topic: topic.trim() || GAME_STATE_CONFIG.defaults.topic,
			maxQuestionsPerGame: modeConfig.showQuestionLimit ? maxQuestionsPerGame : modeConfig.defaults.maxQuestionsPerGame,
			timeLimit: modeConfig.showTimeLimit ? timeLimit : undefined,
			answerCount: answerCount,
		};

		onModeSelect?.(selectedMode, settings);
		setDialogOpen(false);
	};

	return (
		<>
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
				{GAME_MODES.map(([mode, config], index) => {
					const Icon = config.icon;

					return (
						<motion.div
							key={mode}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.1 }}
						>
							<Card
								className='p-6 hover:shadow-lg transition-all cursor-pointer group hover:border-primary/50'
								onClick={() => handleModeClick(mode)}
							>
								<div className='flex flex-col items-center text-center space-y-4'>
									<div className='relative'>
										<div className='p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors'>
											<Icon className='w-8 h-8 text-primary' />
										</div>
									</div>
									<div>
										<h3 className='text-xl font-semibold mb-1'>{config.name}</h3>
										<p className='text-muted-foreground text-sm'>{config.description}</p>
									</div>
									<p className='text-xs text-muted-foreground'>Click to customize</p>
								</div>
							</Card>
						</motion.div>
					);
				})}
			</div>

			{/* Settings Dialog */}
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent className='sm:max-w-lg max-h-[90vh] overflow-y-auto'>
					<DialogHeader>
						<DialogTitle className='flex items-center gap-2'>
							{selectedMode &&
								(() => {
									const Icon = GAME_MODE_ICONS[selectedMode];
									const config = GAME_MODES_CONFIG[selectedMode];
									return (
										<>
											<Icon className='w-5 h-5 text-primary' />
											{config.name}
										</>
									);
								})()}
							{isAdmin && (
								<Badge
									variant={VariantBase.SECONDARY}
									className='ml-2 bg-amber-500/10 text-amber-600 border-amber-500/30'
								>
									<Crown className='w-3 h-3 mr-1' />
									Free Play
								</Badge>
							)}
						</DialogTitle>
						<DialogDescription>Customize your game settings before starting</DialogDescription>
					</DialogHeader>

					{/* Credit Warning */}
					{!isAdmin && !canPlay && (
						<Alert variant={VariantBase.DESTRUCTIVE} className='my-2'>
							<AlertCircle className='h-4 w-4' />
							<AlertDescription>
								Not enough credits. You need {creditCheckQuestionLimit} credits to play.
							</AlertDescription>
						</Alert>
					)}

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
								onChange={e => setTopic(e.target.value)}
							/>

							{/* Your Most Played Topic */}
							{mostPlayedTopic && mostPlayedTopic !== 'None' && (
								<div className='space-y-2'>
									<Label className='text-xs text-muted-foreground'>Your Most Played</Label>
									<Button
										type='button'
										variant={topic === mostPlayedTopic ? ButtonVariant.DEFAULT : ButtonVariant.OUTLINE}
										size={ButtonSize.SM}
										className='w-full justify-start bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/20'
										onClick={() => setTopic(topic === mostPlayedTopic ? '' : mostPlayedTopic)}
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
													onClick={() => setTopic(topic === t ? '' : t)}
												>
													<BookOpen className='h-3 w-3 mr-1' />
													{t} ({gameCount} {gameCount === 1 ? 'game' : 'games'})
												</Button>
											);
										})}
									</div>
								</div>
							)}

							{/* Popular Topics */}
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
											onClick={() => setTopic(topic === t ? '' : t)}
										>
											<BookOpen className='h-3 w-3 mr-1' />
											{t}
										</Button>
									))}
								</div>
							</div>
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
									onClick={() => setSelectedDifficulty(DifficultyLevel.EASY)}
									className='flex items-center justify-center gap-2'
								>
									<span className='w-2 h-2 rounded-full bg-green-500' />
									Easy
								</Button>
								<Button
									type='button'
									variant={
										selectedDifficulty === DifficultyLevel.MEDIUM ? ButtonVariant.DEFAULT : ButtonVariant.OUTLINE
									}
									size={ButtonSize.SM}
									onClick={() => setSelectedDifficulty(DifficultyLevel.MEDIUM)}
									className='flex items-center justify-center gap-2'
								>
									<span className='w-2 h-2 rounded-full bg-yellow-500' />
									Medium
								</Button>
								<Button
									type='button'
									variant={selectedDifficulty === DifficultyLevel.HARD ? ButtonVariant.DEFAULT : ButtonVariant.OUTLINE}
									size={ButtonSize.SM}
									onClick={() => setSelectedDifficulty(DifficultyLevel.HARD)}
									className='flex items-center justify-center gap-2'
								>
									<span className='w-2 h-2 rounded-full bg-red-500' />
									Hard
								</Button>
								<Button
									type='button'
									variant={
										selectedDifficulty === DifficultyLevel.CUSTOM ? ButtonVariant.DEFAULT : ButtonVariant.OUTLINE
									}
									size={ButtonSize.SM}
									onClick={() => setSelectedDifficulty(DifficultyLevel.CUSTOM)}
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
											setCustomDifficulty(e.target.value);
											// Clear error when user starts typing
											if (customDifficultyError) {
												setCustomDifficultyError('');
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
									<p className='text-xs text-muted-foreground'>
										The AI will generate questions based on your description
									</p>
								</div>
							)}
						</div>

						{/* Settings Grid - Questions/Time and Answer Count */}
						<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
							{/* Question Limit (for Question Mode) */}
							{selectedMode && GAME_MODES_CONFIG[selectedMode].showQuestionLimit && (
								<div className='space-y-3'>
									<Label className='flex items-center gap-2'>
										<FileQuestion className='h-4 w-4 text-muted-foreground' />
										Number of Questions
									</Label>
									<div className='flex justify-start'>
										<NumberInput
											value={maxQuestionsPerGame}
											onChange={setMaxQuestionsPerGame}
											min={VALIDATION_CONFIG.limits.QUESTIONS.MIN}
											max={VALIDATION_CONFIG.limits.QUESTIONS.MAX}
											step={VALIDATION_CONFIG.limits.QUESTIONS.STEP}
										/>
									</div>
								</div>
							)}

							{/* Time Limit (for Time Attack) */}
							{selectedMode && GAME_MODES_CONFIG[selectedMode].showTimeLimit && (
								<div className='space-y-3'>
									<Label className='flex items-center gap-2'>
										<Clock className='h-4 w-4 text-muted-foreground' />
										Time Limit (seconds)
									</Label>
									<div className='flex justify-start'>
										<NumberInput
											value={timeLimit}
											onChange={setTimeLimit}
											min={VALIDATION_CONFIG.limits.TIME_LIMIT.MIN}
											max={VALIDATION_CONFIG.limits.TIME_LIMIT.MAX}
											step={VALIDATION_CONFIG.limits.TIME_LIMIT.STEP}
										/>
									</div>
									<p className='text-xs text-muted-foreground'>{formatTimeDisplay(timeLimit)}</p>
								</div>
							)}

							{/* Answer Count Selection */}
							<div className='space-y-3'>
								<Label className='flex items-center gap-2'>
									<CheckSquare className='h-4 w-4 text-muted-foreground' />
									Number of Answer Choices
								</Label>
								<div className='flex justify-start'>
									<NumberInput
										value={answerCount}
										onChange={setAnswerCount}
										min={VALIDATION_CONFIG.limits.ANSWER_COUNT.MIN}
										max={VALIDATION_CONFIG.limits.ANSWER_COUNT.MAX}
										step={VALIDATION_CONFIG.limits.ANSWER_COUNT.STEP}
									/>
								</div>
							</div>
						</div>

						{/* Unlimited Mode Info */}
						{selectedMode === GameModeEnum.UNLIMITED && (
							<div className='p-4 rounded-lg bg-muted/50 text-center'>
								<p className='text-sm text-muted-foreground'>
									Play without limits! Answer questions until you decide to stop.
								</p>
							</div>
						)}
					</div>

					<DialogFooter className='gap-2 sm:gap-0'>
						<Button variant={ButtonVariant.OUTLINE} onClick={() => setDialogOpen(false)}>
							Cancel
						</Button>
						<Button onClick={handleStartGame} disabled={!isAdmin && !canPlay}>
							Start Game
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* No Credits Dialog */}
			<Dialog open={noCreditsDialogOpen} onOpenChange={setNoCreditsDialogOpen}>
				<DialogContent className='sm:max-w-md'>
					<DialogHeader>
						<DialogTitle className='flex items-center gap-2 text-destructive'>
							<AlertCircle className='w-5 h-5' />
							Not Enough Credits
						</DialogTitle>
						<DialogDescription>
							You don't have enough credits to start this game. Purchase more credits to continue playing.
						</DialogDescription>
					</DialogHeader>
					<div className='py-4'>
						<p className='text-sm text-muted-foreground mb-4'>
							You need <span className='font-bold text-foreground'>{creditCheckQuestionLimit}</span> credits for this
							game.
						</p>
					</div>
					<DialogFooter className='gap-2 sm:gap-0'>
						<Button variant={ButtonVariant.OUTLINE} onClick={() => setNoCreditsDialogOpen(false)}>
							Cancel
						</Button>
						<Button onClick={() => navigate(ROUTES.PAYMENT, { state: { modal: true, returnUrl: ROUTES.GAME_PLAY } })}>
							<CreditCard className='w-4 h-4 mr-2' />
							Get Credits
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
