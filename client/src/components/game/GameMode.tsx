import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
	AlertCircle,
	Clock,
	CreditCard,
	Crown,
	Infinity,
	ListOrdered,
} from 'lucide-react';

import {
	CREDIT_COSTS,
	CUSTOM_DIFFICULTY_PREFIX,
	DifficultyLevel,
	GAME_MODES_CONFIG,
	GAME_STATE_CONFIG,
	GameMode as GameModeEnum,
	UserRole,
} from '@shared/constants';
import type { GameDifficulty } from '@shared/types';
import { validateCustomDifficultyText } from '@shared/validation';
import { calculateRequiredCredits } from '@shared/utils';
import {
	ButtonVariant,
	ROUTES,
	SCORING_DEFAULTS,
	VALIDATION_MESSAGES,
	VariantBase,
} from '@/constants';
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
} from '@/components';
import { GameSettingsForm } from './GameSettingsForm';
import { useAppSelector, useCanPlay } from '@/hooks';
import type { GameConfig, GameModeOption } from '@/types';
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
	const [selectedMode, setSelectedMode] = useState<GameModeEnum | undefined>(undefined);
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

	// Calculate the value for credit check based on game mode:
	// - TIME_LIMITED: Uses timeLimit in seconds (5 credits per 30 seconds)
	// - QUESTION_LIMITED: Uses maxQuestionsPerGame (1 credit per question)
	// - UNLIMITED: Uses 1 credit for first question (real-time deduction)
	const getCreditCheckValue = (): number => {
		if (!selectedMode) return maxQuestionsPerGame;

		const costConfig = CREDIT_COSTS[selectedMode];

		// If mode charges after game, return 0 to allow starting
		// Note: UNLIMITED mode now charges in real-time, so it requires 1 credit minimum
		if (costConfig?.chargeAfterGame) {
			return 0;
		}

		// For UNLIMITED mode, require 1 credit minimum (for first question)
		if (selectedMode === GameModeEnum.UNLIMITED) {
			return 1;
		}

		// For TIME_LIMITED, use timeLimit (seconds) for credit calculation
		if (selectedMode === GameModeEnum.TIME_LIMITED) {
			return timeLimit;
		}

		// Otherwise, use the question count (e.g., QUESTION_LIMITED)
		return maxQuestionsPerGame;
	};

	const creditCheckValue = getCreditCheckValue();
	const { data: canPlay } = useCanPlay(creditCheckValue, selectedMode ?? GameModeEnum.QUESTION_LIMITED);

	// Calculate the actual credit cost to display to the user
	const getDisplayedCreditCost = (): number => {
		if (!selectedMode) return maxQuestionsPerGame;

		// For TIME_LIMITED, use timeLimit (seconds) for calculation
		if (selectedMode === GameModeEnum.TIME_LIMITED) {
			return calculateRequiredCredits(timeLimit, selectedMode);
		}

		return calculateRequiredCredits(maxQuestionsPerGame, selectedMode);
	};
	const displayedCreditCost = getDisplayedCreditCost();


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
				setCustomDifficultyError(validation.errors[0] || VALIDATION_MESSAGES.CUSTOM_DIFFICULTY_INVALID);
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

					{/* Credit Cost Display */}
					{!isAdmin && selectedMode && (
						<div className='my-2 p-3 rounded-lg bg-muted/50 border'>
							<div className='flex items-center justify-between'>
								<span className='text-sm text-muted-foreground flex items-center gap-2'>
									<CreditCard className='h-4 w-4' />
									Credit Cost:
								</span>
								<span className='font-semibold'>
									{selectedMode === GameModeEnum.UNLIMITED ? (
										<span className='text-muted-foreground text-xs'>Charged after game (1 credit/question)</span>
									) : (
										<>
											{displayedCreditCost} {displayedCreditCost === 1 ? 'credit' : 'credits'}
											{selectedMode === GameModeEnum.TIME_LIMITED && (
												<span className='text-xs text-muted-foreground ml-1'>(fixed)</span>
											)}
										</>
									)}
								</span>
							</div>
						</div>
					)}

					{/* Credit Warning */}
					{!isAdmin && !canPlay && (
						<Alert variant={VariantBase.DESTRUCTIVE} className='my-2'>
							<AlertCircle className='h-4 w-4' />
							<AlertDescription>
								Not enough credits. You need {displayedCreditCost} credits to play.
							</AlertDescription>
						</Alert>
					)}

					<GameSettingsForm
						topic={topic}
						onTopicChange={setTopic}
						selectedDifficulty={selectedDifficulty}
						onDifficultyChange={setSelectedDifficulty}
						customDifficulty={customDifficulty}
						onCustomDifficultyChange={setCustomDifficulty}
						customDifficultyError={customDifficultyError}
						onCustomDifficultyErrorChange={setCustomDifficultyError}
						answerCount={answerCount}
						onAnswerCountChange={setAnswerCount}
						selectedMode={selectedMode}
						maxQuestionsPerGame={maxQuestionsPerGame}
						onMaxQuestionsPerGameChange={setMaxQuestionsPerGame}
						timeLimit={timeLimit}
						onTimeLimitChange={setTimeLimit}
					/>

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
							You need <span className='font-bold text-foreground'>{displayedCreditCost}</span> credits for this
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
