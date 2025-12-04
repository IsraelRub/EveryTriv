import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { motion } from 'framer-motion';
import { AlertCircle, BookOpen, CheckSquare, Clock, CreditCard, Crown, FileQuestion, Hash } from 'lucide-react';

import {
	CUSTOM_DIFFICULTY_PREFIX,
	DifficultyLevel,
	GAME_MODE_DEFAULTS,
	GAME_STATE_DEFAULTS,
	GameMode as GameModeEnum,
	UserRole,
	VALIDATION_LIMITS,
} from '@shared/constants';
import type { GameDifficulty } from '@shared/types';

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
import { ButtonSize, GAME_MODES, POPULAR_TOPICS, SCORING_DEFAULTS } from '@/constants';
import { useAppSelector, useCanPlay } from '@/hooks';
import { selectUserRole } from '@/redux/selectors';
import type { GameConfig, GameModeOption, GameModeProps } from '@/types';
import { formatTimeDisplay } from '@/utils';

export function GameMode({ onModeSelect }: GameModeProps): JSX.Element {
	const navigate = useNavigate();
	const [selectedMode, setSelectedMode] = useState<GameModeOption | null>(null);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [noCreditsDialogOpen, setNoCreditsDialogOpen] = useState(false);

	// Settings state
	const [topic, setTopic] = useState<string>(GAME_STATE_DEFAULTS.TOPIC);
	const [maxQuestionsPerGame, setMaxQuestionsPerGame] = useState<number>(
		GAME_MODE_DEFAULTS[GameModeEnum.QUESTION_LIMITED].maxQuestionsPerGame
	);
	const [timeLimit, setTimeLimit] = useState<number>(GAME_MODE_DEFAULTS[GameModeEnum.TIME_LIMITED].timeLimit);
	const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>(DifficultyLevel.MEDIUM);
	const [customDifficulty, setCustomDifficulty] = useState('');
	const [answerCount, setAnswerCount] = useState<number>(SCORING_DEFAULTS.ANSWER_COUNT);

	// Credit check
	const userRole = useAppSelector(selectUserRole);
	const isAdmin = userRole === UserRole.ADMIN;
	// Calculate the correct question count for credit check
	// Convert undefined to UNLIMITED (-1) for API (canPlay needs a number)
	const creditCheckQuestionLimit = selectedMode?.showQuestionLimit
		? maxQuestionsPerGame
		: VALIDATION_LIMITS.QUESTIONS.UNLIMITED;
	const { data: canPlay } = useCanPlay(creditCheckQuestionLimit, selectedMode?.id ?? GameModeEnum.QUESTION_LIMITED);

	const handleModeClick = (mode: GameModeOption) => {
		// Set default values based on mode
		const defaults = GAME_MODE_DEFAULTS[mode.id];
		// Only update maxQuestionsPerGame if it's defined (not undefined) and showQuestionLimit is true
		if (defaults.maxQuestionsPerGame !== undefined && defaults.maxQuestionsPerGame !== null) {
			setMaxQuestionsPerGame(defaults.maxQuestionsPerGame);
		}
		if (defaults.timeLimit) {
			setTimeLimit(defaults.timeLimit);
		}

		// Reset form
		setTopic(GAME_STATE_DEFAULTS.TOPIC);
		setSelectedDifficulty(DifficultyLevel.MEDIUM);
		setCustomDifficulty('');
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

		// Format custom difficulty with prefix, or use standard difficulty
		let finalDifficulty: GameDifficulty;
		if (selectedDifficulty === DifficultyLevel.CUSTOM) {
			finalDifficulty = customDifficulty.trim()
				? `${CUSTOM_DIFFICULTY_PREFIX}${customDifficulty.trim()}`
				: DifficultyLevel.MEDIUM;
		} else {
			finalDifficulty = selectedDifficulty;
		}

		const settings: GameConfig = {
			mode: selectedMode.id,
			difficulty: finalDifficulty,
			topic: topic.trim() || GAME_STATE_DEFAULTS.TOPIC,
			maxQuestionsPerGame: selectedMode.showQuestionLimit
				? maxQuestionsPerGame
				: GAME_MODE_DEFAULTS[selectedMode.id]?.maxQuestionsPerGame,
			timeLimit: selectedMode.showTimeLimit ? timeLimit : undefined,
			answerCount: answerCount,
		};

		onModeSelect?.(selectedMode.id, settings);
		setDialogOpen(false);
	};

	return (
		<>
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
				{GAME_MODES.map((mode, index) => {
					const Icon = mode.icon;

					return (
						<motion.div
							key={mode.id}
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
										<h3 className='text-xl font-semibold mb-1'>{mode.name}</h3>
										<p className='text-muted-foreground text-sm'>{mode.description}</p>
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
							{selectedMode && (
								<>
									<selectedMode.icon className='w-5 h-5 text-primary' />
									{selectedMode.name}
								</>
							)}
							{isAdmin && (
								<Badge variant='secondary' className='ml-2 bg-amber-500/10 text-amber-600 border-amber-500/30'>
									<Crown className='w-3 h-3 mr-1' />
									Free Play
								</Badge>
							)}
						</DialogTitle>
						<DialogDescription>Customize your game settings before starting</DialogDescription>
					</DialogHeader>

					{/* Credit Warning */}
					{!isAdmin && !canPlay && (
						<Alert variant='destructive' className='my-2'>
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
							<div className='flex flex-wrap gap-2'>
								{POPULAR_TOPICS.slice(0, 5).map(t => (
									<Button
										key={t}
										type='button'
										variant={topic === t ? 'default' : 'outline'}
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

						{/* Settings Grid */}
						<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
							{/* Difficulty Selection */}
							<div className='space-y-3'>
								<Label className='flex items-center gap-2'>
									<AlertCircle className='h-4 w-4 text-muted-foreground' />
									Difficulty
								</Label>
								<div className='grid grid-cols-2 gap-2'>
									<Button
										type='button'
										variant={selectedDifficulty === DifficultyLevel.EASY ? 'default' : 'outline'}
										size={ButtonSize.SM}
										onClick={() => setSelectedDifficulty(DifficultyLevel.EASY)}
										className='flex items-center justify-center gap-2'
									>
										<span className='w-2 h-2 rounded-full bg-green-500' />
										Easy
									</Button>
									<Button
										type='button'
										variant={selectedDifficulty === DifficultyLevel.MEDIUM ? 'default' : 'outline'}
										size={ButtonSize.SM}
										onClick={() => setSelectedDifficulty(DifficultyLevel.MEDIUM)}
										className='flex items-center justify-center gap-2'
									>
										<span className='w-2 h-2 rounded-full bg-yellow-500' />
										Medium
									</Button>
									<Button
										type='button'
										variant={selectedDifficulty === DifficultyLevel.HARD ? 'default' : 'outline'}
										size={ButtonSize.SM}
										onClick={() => setSelectedDifficulty(DifficultyLevel.HARD)}
										className='flex items-center justify-center gap-2'
									>
										<span className='w-2 h-2 rounded-full bg-red-500' />
										Hard
									</Button>
									<Button
										type='button'
										variant={selectedDifficulty === DifficultyLevel.CUSTOM ? 'default' : 'outline'}
										size={ButtonSize.SM}
										onClick={() => setSelectedDifficulty(DifficultyLevel.CUSTOM)}
										className='flex items-center justify-center gap-2'
									>
										<span className='w-2 h-2 rounded-full bg-purple-500' />
										Custom
									</Button>
								</div>
							</div>

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
										min={VALIDATION_LIMITS.ANSWER_COUNT.MIN}
										max={VALIDATION_LIMITS.ANSWER_COUNT.MAX}
										step={VALIDATION_LIMITS.ANSWER_COUNT.STEP}
									/>
								</div>
							</div>

							{/* Question Limit (for Question Mode) */}
							{selectedMode?.showQuestionLimit && (
								<div className='space-y-3'>
									<Label className='flex items-center gap-2'>
										<FileQuestion className='h-4 w-4 text-muted-foreground' />
										Number of Questions
									</Label>
									<div className='flex justify-start'>
										<NumberInput
											value={maxQuestionsPerGame}
											onChange={setMaxQuestionsPerGame}
											min={VALIDATION_LIMITS.QUESTIONS.MIN}
											max={VALIDATION_LIMITS.QUESTIONS.MAX}
											step={VALIDATION_LIMITS.QUESTIONS.STEP}
										/>
									</div>
								</div>
							)}

							{/* Time Limit (for Time Attack) */}
							{selectedMode?.showTimeLimit && (
								<div className='space-y-3'>
									<Label className='flex items-center gap-2'>
										<Clock className='h-4 w-4 text-muted-foreground' />
										Time Limit (seconds)
									</Label>
									<div className='flex justify-start'>
										<NumberInput
											value={timeLimit}
											onChange={setTimeLimit}
											min={VALIDATION_LIMITS.TIME_LIMIT.MIN}
											max={VALIDATION_LIMITS.TIME_LIMIT.MAX}
											step={VALIDATION_LIMITS.TIME_LIMIT.STEP}
										/>
									</div>
									<p className='text-xs text-muted-foreground'>{formatTimeDisplay(timeLimit)}</p>
								</div>
							)}
						</div>

						{/* Custom Difficulty Input */}
						{selectedDifficulty === DifficultyLevel.CUSTOM && (
							<div className='space-y-2'>
								<Textarea
									placeholder="Describe your custom difficulty...&#10;Example: 'Questions about advanced quantum physics for PhD students'"
									value={customDifficulty}
									onChange={e => setCustomDifficulty(e.target.value)}
									className='min-h-[80px]'
								/>
								<p className='text-xs text-muted-foreground'>
									The AI will generate questions based on your description
								</p>
							</div>
						)}

						{/* Unlimited Mode Info */}
						{selectedMode?.id === GameModeEnum.UNLIMITED && (
							<div className='p-4 rounded-lg bg-muted/50 text-center'>
								<p className='text-sm text-muted-foreground'>
									Play without limits! Answer questions until you decide to stop.
								</p>
							</div>
						)}
					</div>

					<DialogFooter className='gap-2 sm:gap-0'>
						<Button variant='outline' onClick={() => setDialogOpen(false)}>
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
						<Button variant='outline' onClick={() => setNoCreditsDialogOpen(false)}>
							Cancel
						</Button>
						<Button onClick={() => navigate('/payment', { state: { modal: true, returnUrl: '/game/play' } })}>
							<CreditCard className='w-4 h-4 mr-2' />
							Get Credits
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
