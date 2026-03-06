import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, CreditCard, Crown, Infinity, ListOrdered, LucideIcon, Play, Users } from 'lucide-react';

import {
	GAME_MODES_CONFIG,
	GAME_STATE_DEFAULTS,
	GameMode as GameModeEnum,
	TIME_DURATIONS_SECONDS,
} from '@shared/constants';
import type { GameConfig } from '@shared/types';
import { calculateRequiredCredits } from '@shared/utils';

import { AlertVariant, ANIMATION_DELAYS, Colors, GAME_MODES_SET, ROUTES, VariantBase } from '@/constants';
import {
	Alert,
	AlertDescription,
	AlertIcon,
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
import { useCanPlay, useGameSettingsForm } from '@/hooks';
import type { GameModeOption } from '@/types';
import { cn } from '@/utils';
import { GameSettingsForm } from './GameSettingsForm';

// Icon mapping for game modes
const GAME_MODE_ICONS: Record<GameModeEnum, LucideIcon> = {
	[GameModeEnum.QUESTION_LIMITED]: ListOrdered,
	[GameModeEnum.TIME_LIMITED]: Clock,
	[GameModeEnum.UNLIMITED]: Infinity,
	[GameModeEnum.MULTIPLAYER]: Users,
} as const;

const GAME_MODES_OPTIONS: [GameModeEnum, GameModeOption][] = Object.keys(GAME_MODES_CONFIG)
	.filter((key: string): key is GameModeEnum => GAME_MODES_SET.has(key))
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

export function GameMode({ onModeSelect }: { onModeSelect: (settings: GameConfig) => void }): JSX.Element {
	const navigate = useNavigate();
	const [selectedMode, setSelectedMode] = useState<GameModeEnum | undefined>(undefined);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [noCreditsDialogOpen, setNoCreditsDialogOpen] = useState(false);

	// Shared game settings form state & validation
	const {
		topic,
		topicError,
		selectedDifficulty,
		customDifficulty,
		customDifficultyError,
		answerCount,
		isAdmin,
		handleTopicChange,
		setSelectedDifficulty,
		setCustomDifficulty,
		setCustomDifficultyError,
		setAnswerCount,
		validateSettings,
		resetForm,
	} = useGameSettingsForm();

	// Mode-specific state (not shared with multiplayer)
	const [maxQuestionsPerGame, setMaxQuestionsPerGame] = useState<number>(
		GAME_MODES_CONFIG[GameModeEnum.QUESTION_LIMITED].defaults.maxQuestionsPerGame ?? 10
	);
	const [timeLimit, setTimeLimit] = useState<number>(
		GAME_MODES_CONFIG[GameModeEnum.TIME_LIMITED].defaults.timeLimit ?? TIME_DURATIONS_SECONDS.MINUTE
	);

	// Credit check
	// Calculate the value for credit check based on game mode:
	// - TIME_LIMITED: Uses timeLimit in seconds (5 credits per 30 seconds)
	// - QUESTION_LIMITED: Uses maxQuestionsPerGame (1 credit per question)
	// - UNLIMITED: Uses 1 credit for first question (real-time deduction)
	const getCreditCheckValue = (): number => {
		if (!selectedMode) return maxQuestionsPerGame;

		const costConfig = GAME_MODES_CONFIG[selectedMode];

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

	const SelectedModeIcon = selectedMode ? GAME_MODE_ICONS[selectedMode] : null;
	const selectedModeConfig = selectedMode ? GAME_MODES_CONFIG[selectedMode] : null;

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
		if (defaults.maxQuestionsPerGame != null) {
			setMaxQuestionsPerGame(defaults.maxQuestionsPerGame);
		}
		if (defaults.timeLimit) {
			setTimeLimit(defaults.timeLimit);
		}

		resetForm();
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

		const { isValid, finalDifficulty } = validateSettings();
		if (!isValid) return;

		const modeConfig = GAME_MODES_CONFIG[selectedMode];
		const settings: GameConfig = {
			mode: selectedMode,
			difficulty: finalDifficulty,
			topic: topic.trim() || GAME_STATE_DEFAULTS.TOPIC,
			maxQuestionsPerGame: modeConfig.showQuestionLimit ? maxQuestionsPerGame : modeConfig.defaults.maxQuestionsPerGame,
			timeLimit: modeConfig.showTimeLimit ? timeLimit : undefined,
			answerCount,
		};

		onModeSelect(settings);
		setDialogOpen(false);
	};

	return (
		<>
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
				{GAME_MODES_OPTIONS.map(([mode, config], index) => {
					const Icon = config.icon;

					return (
						<motion.div
							key={mode}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * ANIMATION_DELAYS.STAGGER_NORMAL }}
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
				<DialogContent className='sm:max-w-lg max-h-[90vh] flex flex-col'>
					<DialogHeader className='flex-shrink-0'>
						<DialogTitle className='flex items-center gap-2'>
							{selectedMode && SelectedModeIcon && selectedModeConfig && (
								<>
									<SelectedModeIcon className='w-5 h-5 text-primary' />
									{selectedModeConfig.name}
								</>
							)}
							{isAdmin && (
								<Badge
									variant={VariantBase.SECONDARY}
									className={cn(
										'ml-2',
										`${Colors.AMBER_600.border}/30`,
										`${Colors.AMBER_600.bg}/10`,
										Colors.AMBER_600.text
									)}
								>
									<Crown className='w-3 h-3 mr-1' />
									Free Play
								</Badge>
							)}
						</DialogTitle>
						<DialogDescription>Customize your game settings before starting</DialogDescription>
					</DialogHeader>

					<div className='flex-1 overflow-y-auto space-y-4 py-4'>
						{/* Credit Cost Display */}
						{!isAdmin && selectedMode && (
							<div className='p-3 rounded-lg bg-muted/50 border'>
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
							<Alert variant={AlertVariant.DESTRUCTIVE}>
								<AlertDescription>Not enough credits. You need {displayedCreditCost} credits to play.</AlertDescription>
							</Alert>
						)}

						<GameSettingsForm
							topic={topic}
							onTopicChange={handleTopicChange}
							topicError={topicError}
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
					</div>

					<DialogFooter className='flex-shrink-0 gap-2 sm:gap-0'>
						<Button variant={VariantBase.OUTLINE} onClick={() => setDialogOpen(false)}>
							Cancel
						</Button>
						<Button onClick={handleStartGame} disabled={!isAdmin && !canPlay}>
							<Play className='h-4 w-4 mr-2' />
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
							<AlertIcon size='lg' />
							Not Enough Credits
						</DialogTitle>
						<DialogDescription>
							You don't have enough credits to start this game. Purchase more credits to continue playing.
						</DialogDescription>
					</DialogHeader>
					<div className='py-4'>
						<p className='text-sm text-muted-foreground mb-4'>
							You need <span className='font-bold text-foreground'>{displayedCreditCost}</span> credits for this game.
						</p>
					</div>
					<DialogFooter className='gap-2 sm:gap-0'>
						<Button variant={VariantBase.OUTLINE} onClick={() => setNoCreditsDialogOpen(false)}>
							Cancel
						</Button>
						<Button onClick={() => navigate(ROUTES.PAYMENT, { state: { modal: true, returnUrl: ROUTES.GAME_SINGLE } })}>
							<CreditCard className='w-4 h-4 mr-2' />
							Get Credits
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
