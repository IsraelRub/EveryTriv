import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, Crown, Infinity, ListOrdered, LucideIcon, Play, Timer, Users } from 'lucide-react';

import { DEFAULT_GAME_CONFIG, GAME_MODES_CONFIG, GameMode as GameModeEnum, VALIDATION_COUNT } from '@shared/constants';
import type { GameConfig } from '@shared/types';
import { calculateRequiredCredits } from '@shared/utils';

import {
	AlertIconSize,
	AlertVariant,
	ANIMATION_DELAYS,
	Colors,
	GAME_MODES_SET,
	GameKey,
	ROUTES,
	VariantBase,
} from '@/constants';
import type { GameModeOption } from '@/types';
import { cn } from '@/utils';
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
import { GameSettingsForm } from './GameSettingsForm';

// Icon mapping for game modes
const GAME_MODE_ICONS: Record<GameModeEnum, LucideIcon> = {
	[GameModeEnum.QUESTION_LIMITED]: ListOrdered,
	[GameModeEnum.TIME_LIMITED]: Timer,
	[GameModeEnum.UNLIMITED]: Infinity,
	[GameModeEnum.MULTIPLAYER]: Users,
} as const;

const GAME_MODE_NAME_KEYS: Record<GameModeEnum, string> = {
	[GameModeEnum.QUESTION_LIMITED]: 'game:modeQuestionLimited',
	[GameModeEnum.TIME_LIMITED]: 'game:modeTimeLimited',
	[GameModeEnum.UNLIMITED]: 'game:modeUnlimited',
	[GameModeEnum.MULTIPLAYER]: 'game:multiplayer',
} as const;

const GAME_MODE_DESC_KEYS: Record<GameModeEnum, string> = {
	[GameModeEnum.QUESTION_LIMITED]: 'game:modeQuestionLimitedDescription',
	[GameModeEnum.TIME_LIMITED]: 'game:modeTimeLimitedDescription',
	[GameModeEnum.UNLIMITED]: 'game:modeUnlimitedDescription',
	[GameModeEnum.MULTIPLAYER]: 'game:competeWithFriends',
} as const;

const GAME_MODES_OPTIONS: [GameModeEnum, GameModeOption & { nameKey: string; descKey: string }][] = Object.keys(
	GAME_MODES_CONFIG
)
	.filter((key: string): key is GameModeEnum => GAME_MODES_SET.has(key))
	.filter(mode => mode !== GameModeEnum.MULTIPLAYER)
	.map(mode => [
		mode,
		{
			name: GAME_MODES_CONFIG[mode].name,
			description: GAME_MODES_CONFIG[mode].description,
			nameKey: GAME_MODE_NAME_KEYS[mode],
			descKey: GAME_MODE_DESC_KEYS[mode],
			icon: GAME_MODE_ICONS[mode],
			showQuestionLimit: GAME_MODES_CONFIG[mode].showQuestionLimit,
			showTimeLimit: GAME_MODES_CONFIG[mode].showTimeLimit,
		},
	]);

export function GameMode({ onModeSelect }: { onModeSelect: (settings: GameConfig) => void }): JSX.Element {
	const { t } = useTranslation('game');
	const navigate = useNavigate();
	const [selectedMode, setSelectedMode] = useState<GameModeEnum | undefined>(undefined);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [noCreditsDialogOpen, setNoCreditsDialogOpen] = useState(false);

	// Shared game settings form state & validation
	const {
		topic,
		topicError,
		topicLanguageStatus,
		topicLanguageError,
		selectedDifficulty,
		customDifficulty,
		customDifficultyError,
		customDifficultyLanguageStatus,
		customDifficultyLanguageError,
		answerCount,
		isAdmin,
		canSubmitLanguage,
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
		GAME_MODES_CONFIG[GameModeEnum.TIME_LIMITED].defaults.timeLimit ?? VALIDATION_COUNT.TIME_LIMIT.DEFAULT
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
		if (!canSubmitLanguage) return;

		const modeConfig = GAME_MODES_CONFIG[selectedMode];
		const settings: GameConfig = {
			mode: selectedMode,
			difficulty: finalDifficulty,
			topic: topic.trim() || DEFAULT_GAME_CONFIG.defaultTopic,
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
										<h3 className='text-xl font-semibold mb-1'>{t(config.nameKey)}</h3>
										<p className='text-muted-foreground text-sm'>{t(config.descKey)}</p>
									</div>
									<p className='text-xs text-muted-foreground'>{t(GameKey.CLICK_TO_CUSTOMIZE)}</p>
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
									{t(GAME_MODE_NAME_KEYS[selectedMode])}
								</>
							)}
							{isAdmin && (
								<Badge
									variant={VariantBase.SECONDARY}
									className={cn(
										'ms-2',
										`${Colors.AMBER_600.border}/30`,
										`${Colors.AMBER_600.bg}/10`,
										Colors.AMBER_600.text
									)}
								>
									<Crown className='w-3 h-3 me-1' />
									{t(GameKey.FREE_PLAY)}
								</Badge>
							)}
						</DialogTitle>
						<DialogDescription>{t(GameKey.CUSTOMIZE_GAME_SETTINGS_BEFORE_STARTING)}</DialogDescription>
					</DialogHeader>

					<div className='flex-1 overflow-y-auto space-y-4 py-4'>
						{/* Credit Cost Display */}
						{!isAdmin && selectedMode && (
							<Card className='p-3 bg-muted/50'>
								<div className='flex items-center justify-between'>
									<span className='text-sm text-muted-foreground flex items-center gap-2'>
										<CreditCard className='h-4 w-4' />
										{t(GameKey.CREDIT_COST)}
									</span>
									<span className='font-semibold'>
										{selectedMode === GameModeEnum.UNLIMITED ? (
											<span className='text-muted-foreground text-xs'>{t(GameKey.CHARGED_AFTER_GAME)}</span>
										) : (
											<>
												{displayedCreditCost} {displayedCreditCost === 1 ? t(GameKey.CREDIT) : t(GameKey.CREDITS)}
												{selectedMode === GameModeEnum.TIME_LIMITED && (
													<span className='text-xs text-muted-foreground ms-1'>({t(GameKey.FIXED)})</span>
												)}
											</>
										)}
									</span>
								</div>
							</Card>
						)}

						{/* Credit Warning */}
						{!isAdmin && !canPlay && (
							<Alert variant={AlertVariant.DESTRUCTIVE}>
								<AlertDescription>
									{t(GameKey.NOT_ENOUGH_CREDITS_IN_DIALOG, { count: displayedCreditCost })}
								</AlertDescription>
							</Alert>
						)}

						<GameSettingsForm
							topic={topic}
							onTopicChange={handleTopicChange}
							topicError={topicError}
							topicLanguageError={topicLanguageError}
							topicLanguageStatus={topicLanguageStatus}
							selectedDifficulty={selectedDifficulty}
							onDifficultyChange={setSelectedDifficulty}
							customDifficulty={customDifficulty}
							onCustomDifficultyChange={setCustomDifficulty}
							customDifficultyError={customDifficultyError}
							onCustomDifficultyErrorChange={setCustomDifficultyError}
							customDifficultyLanguageError={customDifficultyLanguageError}
							customDifficultyLanguageStatus={customDifficultyLanguageStatus}
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
							{t(GameKey.CANCEL)}
						</Button>
						<Button onClick={handleStartGame} disabled={(!isAdmin && !canPlay) || !canSubmitLanguage}>
							<Play className='h-4 w-4 me-2' />
							{t(GameKey.START_GAME)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* No Credits Dialog */}
			<Dialog open={noCreditsDialogOpen} onOpenChange={setNoCreditsDialogOpen}>
				<DialogContent className='sm:max-w-md'>
					<DialogHeader>
						<DialogTitle className='flex items-center gap-2 text-destructive'>
							<AlertIcon size={AlertIconSize.LG} />
							{t(GameKey.NOT_ENOUGH_CREDITS)}
						</DialogTitle>
						<DialogDescription>{t(GameKey.YOU_DONT_HAVE_ENOUGH_CREDITS)}</DialogDescription>
					</DialogHeader>
					<div className='py-4'>
						<p className='text-sm text-muted-foreground mb-4'>
							{t(GameKey.YOU_NEED_CREDITS_FOR_THIS_GAME, { count: displayedCreditCost })}
						</p>
					</div>
					<DialogFooter className='gap-2 sm:gap-0'>
						<Button variant={VariantBase.OUTLINE} onClick={() => setNoCreditsDialogOpen(false)}>
							{t(GameKey.CANCEL)}
						</Button>
						<Button onClick={() => navigate(ROUTES.PAYMENT, { state: { modal: true, returnUrl: ROUTES.GAME_SINGLE } })}>
							<CreditCard className='w-4 h-4 me-2' />
							{t(GameKey.GET_CREDITS)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
