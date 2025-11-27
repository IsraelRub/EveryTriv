import { createContext, FormEvent, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { motion } from 'framer-motion';

import {
	CUSTOM_DIFFICULTY_PREFIX,
	DifficultyLevel,
	GAME_MODE_DEFAULTS,
	GameMode,
	UserRole,
	VALID_DIFFICULTIES,
	VALIDATION_LIMITS,
} from '@shared/constants';
import { clientLogger as logger } from '@shared/services';
import type { FavoriteTopic, GameDifficulty } from '@shared/types';
import { calculateRequiredCredits, formatValidationErrorMessage, getErrorMessage } from '@shared/utils';
import { isCustomDifficulty } from '@shared/validation';

import {
	createStaggerContainer,
	CustomDifficultyHistory,
	DifficultyDisplay,
	ErrorBanner,
	fadeInRight,
	fadeInUp,
	FavoriteTopics,
	Game,
	GameMode as GameModeComponent,
	GridLayout,
	HomeTitle,
	hoverScale,
	Icon,
	ResponsiveGrid,
	scaleIn,
	ScoringSystem,
	SocialShare,
	TriviaForm,
} from '../../components';
import {
	AudioKey,
	CLIENT_STORAGE_KEYS,
	ComponentSize,
	DEFAULT_GAME_STATE,
	GAME_STATE_UPDATES,
	Spacing,
} from '../../constants';
import {
	useAppDispatch,
	useAppSelector,
	useCanPlay,
	useDeductCredits,
	useGameTimer,
	usePrevious,
	useSaveHistory,
	useTriviaQuestionMutation,
	useUserProfile,
	useValidateCustomDifficulty,
	useValueChange,
} from '../../hooks';
import { resetGame } from '../../redux/slices';
import { audioService, customDifficultyService, storageService } from '../../services';
import type { ClientGameState, CurrentQuestionMetadata, RequestedQuestionsOption } from '../../types';
import { getOrCreateClientUserId } from '../../utils';

/**
 * Game Context for sharing game state between components
 *
 * Provides game state management and handlers to child components
 * in the trivia game interface.
 */
const GameContext = createContext<{
	gameState: ClientGameState;
	updateGameState: (updates: Partial<ClientGameState> | ((prev: ClientGameState) => ClientGameState)) => void;
	handleAnswer: (i: number) => Promise<void>;
	loadNextQuestion: () => Promise<void>;
	handleGameEnd: () => void;
} | null>(null);

/**
 * Custom hook to use game context
 *
 * Provides access to the game context with proper error handling.
 * Must be used within a GameProvider component.
 *
 * @returns Game context with state and handlers
 * @throws Error if used outside of GameProvider
 */
export const useGame = () => {
	const context = useContext(GameContext);
	if (!context) {
		throw new Error('useGame must be used within a GameProvider');
	}
	return context;
};

const isGameDifficulty = (value: string): value is GameDifficulty =>
	VALID_DIFFICULTIES.some(difficulty => difficulty === value) || value.startsWith(CUSTOM_DIFFICULTY_PREFIX);

/**
 * Home View Component
 *
 * Main trivia game interface that provides game state management,
 * user preferences, and game mode selection. Handles game flow,
 * scoring, and analytics tracking.
 *
 * @returns JSX element containing the home view interface
 */
export default function HomeView() {
	const dispatch = useAppDispatch();
	const { data: userProfileResponse } = useUserProfile();

	const [topic, setTopic] = useState('');
	const [difficulty, setDifficulty] = useState<GameDifficulty>(DifficultyLevel.MEDIUM);
	const [gameState, setGameState] = useState<ClientGameState>(DEFAULT_GAME_STATE);
	const [userId, setUserId] = useState<string>('');
	const [showHistory, setShowHistory] = useState(false);
	const [isGameActive, setIsGameActive] = useState(false);
	const [showGameModeSelector, setShowGameModeSelector] = useState(false);

	useEffect(() => {
		if (userProfileResponse?.preferences?.game) {
			const gamePrefs = userProfileResponse.preferences.game;

			if (gamePrefs.defaultDifficulty) {
				setDifficulty(gamePrefs.defaultDifficulty);
			}

			if (gamePrefs.defaultTopic) {
				setTopic(gamePrefs.defaultTopic);
			}
		}
	}, [userProfileResponse]);

	const currentGameMode = gameState.gameMode?.mode ?? GameMode.QUESTION_LIMITED;
	const gameModeDefaults = GAME_MODE_DEFAULTS[currentGameMode];

	const requestedQuestions = useMemo<RequestedQuestionsOption>(() => {
		const count = gameState.gameMode?.questionLimit ?? gameModeDefaults.questionLimit;
		return {
			value: count,
			label: count === VALIDATION_LIMITS.REQUESTED_QUESTIONS.UNLIMITED ? 'Unlimited Questions' : `${count} Questions`,
		};
	}, [gameState.gameMode?.questionLimit, gameModeDefaults.questionLimit]);

	const previousScore = usePrevious(gameState.stats?.currentScore);
	const scoreChange = useValueChange(gameState.stats?.currentScore);

	const currentQuestionMetadata = useMemo<CurrentQuestionMetadata | undefined>(() => {
		const metadata = gameState.trivia?.metadata;
		if (!metadata) {
			return undefined;
		}
		return {
			customDifficultyMultiplier: metadata.difficultyScore,
			actualDifficulty: metadata.difficulty ?? metadata.customDifficultyDescription,
			totalQuestions: metadata.usageCount,
		};
	}, [gameState.trivia?.metadata]);

	const triviaMutation = useTriviaQuestionMutation();
	const saveHistoryMutation = useSaveHistory();
	const validateCustomDifficulty = useValidateCustomDifficulty();

	const { data: canPlay } = useCanPlay(requestedQuestions.value, currentGameMode);
	const { mutate: deductCredits } = useDeductCredits();
	const currentUser = useAppSelector(state => state.user.currentUser);
	const isAdmin = currentUser?.role === UserRole.ADMIN;

	const isFormValid = topic.trim().length > 0 && difficulty.trim().length > 0;

	const updateDifficultySelection = (nextDifficulty: string) => {
		if (isGameDifficulty(nextDifficulty)) {
			setDifficulty(nextDifficulty);
		}
	};

	const createGameModeConfig = useCallback(
		(
			mode: GameMode,
			config: { timeLimit?: number; questionLimit: number; timeRemaining?: number },
			existingGameMode?: ClientGameState['gameMode']
		): ClientGameState['gameMode'] => {
			return {
				mode,
				timer: {
					isRunning: existingGameMode?.timer?.isRunning ?? false,
					startTime: existingGameMode?.timer?.startTime ?? null,
					timeElapsed: existingGameMode?.timer?.timeElapsed ?? 0,
					timeRemaining: config.timeRemaining,
				},
				isGameOver: existingGameMode?.isGameOver ?? false,
				timeLimit: config.timeLimit,
				questionLimit: config.questionLimit,
			};
		},
		[]
	);

	useEffect(() => {
		const loadUserId = async () => {
			const id = await getOrCreateClientUserId();
			setUserId(id);
		};
		loadUserId();
	}, []);

	useEffect(() => {
		logger.navigationPage('home');
		return () => {
			logger.navigationPage('home-exit');
		};
	}, []);

	useEffect(() => {
		const handleScoreChange = async () => {
			if (scoreChange.hasChanged && previousScore !== undefined) {
				const currentScore = gameState.stats?.currentScore ?? 0;
				logger.gameInfo('Score changed', {
					previousScore,
					newScore: currentScore,
					change: currentScore - previousScore,
				});

				const totalQuestions = gameState.stats?.questionsAnswered ?? 0;
				audioService.playAchievementSound(currentScore, totalQuestions, previousScore);

				await storageService.set(CLIENT_STORAGE_KEYS.SCORE_HISTORY, {
					score: currentScore,
					topic: gameState.config?.topic ?? topic,
					difficulty: gameState.config?.difficulty ?? difficulty,
					timestamp: Date.now(),
				});

				if (currentScore > previousScore) {
					audioService.play(AudioKey.SCORE_EARNED);
				} else if (currentScore < previousScore) {
					audioService.play(AudioKey.ERROR);
				}
			}
		};
		handleScoreChange();
	}, [
		scoreChange.hasChanged,
		previousScore,
		gameState.stats?.currentScore,
		gameState.config?.topic,
		gameState.config?.difficulty,
		topic,
		difficulty,
	]);

	const updateGameState = useCallback(
		(updates: Partial<ClientGameState> | ((prev: ClientGameState) => ClientGameState)) => {
			if (typeof updates === 'function') {
				setGameState(updates);
			} else {
				setGameState((prev: ClientGameState) => ({ ...prev, ...updates }));
			}
		},
		[]
	);

	const removeFavorite = useCallback(
		(i: number) => {
			updateGameState((prev: ClientGameState) => ({
				...prev,
				favorites: (prev.favorites ?? []).filter((_favorite, index) => index !== i),
			}));
		},
		[updateGameState]
	);

	const selectFavorite = useCallback((favorite: FavoriteTopic) => {
		setTopic(favorite.topic);
		setDifficulty(favorite.difficulty);
	}, []);

	const selectFromHistory = useCallback((historyTopic: string, historyDifficulty: string) => {
		setTopic(historyTopic);
		if (isGameDifficulty(historyDifficulty)) {
			setDifficulty(historyDifficulty);
		}
	}, []);

	const updateStats = useCallback(
		(topic: string, difficulty: string, isCorrect: boolean, currentStats?: ClientGameState['stats']) => {
			const stats = currentStats ?? gameState.stats;
			const statsDifficulty = isCustomDifficulty(difficulty) ? 'custom' : difficulty;

			return {
				topicsPlayed: {
					...(stats?.topicsPlayed ?? {}),
					[topic]: ((stats?.topicsPlayed ?? {})[topic] ?? 0) + 1,
				},
				successRateByDifficulty: {
					...(stats?.successRateByDifficulty ?? {}),
					[statsDifficulty]: {
						correct: ((stats?.successRateByDifficulty ?? {})[statsDifficulty]?.correct ?? 0) + (isCorrect ? 1 : 0),
						total: ((stats?.successRateByDifficulty ?? {})[statsDifficulty]?.total ?? 0) + 1,
					},
				},
			};
		},
		[gameState.stats]
	);

	const handleAnswer = useCallback(
		async (i: number) => {
			if (gameState.selected !== null || !gameState.trivia) return;
			const isCorrect = gameState.trivia.answers[i].isCorrect;
			const newStats = updateStats(gameState.trivia.topic, gameState.trivia.difficulty, isCorrect, gameState.stats);

			if (isCorrect) {
				audioService.play(AudioKey.CORRECT_ANSWER);
			} else {
				audioService.play(AudioKey.WRONG_ANSWER);
			}

			const currentScore = (gameState.stats?.currentScore ?? 0) + (isCorrect ? 1 : 0);
			const questionsAnswered = (gameState.stats?.questionsAnswered ?? 0) + 1;
			const maxScore = questionsAnswered;

			updateGameState({
				selected: i,
				stats: {
					currentScore,
					maxScore,
					successRate: (currentScore / questionsAnswered) * 100,
					averageTimePerQuestion: 0,
					correctStreak: isCorrect ? (gameState.stats?.correctStreak ?? 0) + 1 : 0,
					maxStreak: Math.max(
						gameState.stats?.maxStreak ?? 0,
						isCorrect ? (gameState.stats?.correctStreak ?? 0) + 1 : 0
					),
					questionsAnswered,
					correctAnswers: (gameState.stats?.correctAnswers ?? 0) + (isCorrect ? 1 : 0),
					totalGames: gameState.stats?.totalGames ?? 0,
					...newStats,
				},
			});

			await saveHistoryMutation.mutateAsync({
				userId,
				score: currentScore,
				totalQuestions: 1,
				correctAnswers: isCorrect ? 1 : 0,
				difficulty: gameState.trivia.difficulty,
				topic: gameState.trivia.topic,
				gameMode: GameMode.QUESTION_LIMITED,
				timeSpent: gameState.gameMode?.timer?.timeElapsed ?? 0,
				creditsUsed: 1,
				questionsData: [
					{
						question: gameState.trivia.question,
						userAnswer: gameState.trivia.answers[i]?.text ?? '',
						correctAnswer: gameState.trivia.answers[gameState.trivia.correctAnswerIndex]?.text ?? '',
						isCorrect,
						timeSpent: gameState.gameMode?.timer?.timeElapsed ?? 0,
					},
				],
			});

			if (gameState.gameMode?.mode !== 'time-limited' && gameState.gameMode?.mode !== 'question-limited') {
				setTimeout(() => {
					setIsGameActive(false);
				}, GAME_STATE_UPDATES.ANIMATION_DELAYS.ANSWER_FEEDBACK);
			}
		},
		[gameState, userId, updateStats, updateGameState, saveHistoryMutation, audioService]
	);

	const handleGameModeSelect = (config: { mode: GameMode; timeLimit?: number; questionLimit?: number }) => {
		audioService.play(AudioKey.BUTTON_CLICK);

		const gameModeDefaults = GAME_MODE_DEFAULTS[config.mode];
		const newGameModeConfig = {
			timeLimit: config.timeLimit ?? gameModeDefaults.timeLimit,
			questionLimit: config.questionLimit ?? gameModeDefaults.questionLimit,
			timeRemaining: config.timeLimit ?? gameModeDefaults.timeLimit,
		};

		updateGameState({
			gameMode: createGameModeConfig(config.mode, newGameModeConfig, gameState.gameMode),
		});
		audioService.play(AudioKey.MENU_CLOSE);
		audioService.play(AudioKey.MENU_MUSIC);
		setShowGameModeSelector(false);
		startGame();
	};

	const startGame = async () => {
		updateGameState({ error: '', loading: true });
		try {
			if (!isFormValid) {
				throw new Error('Please fill in all required fields');
			}

			// Check if user has enough credits to play (admin users can always play)
			if (!isAdmin && !canPlay) {
				const requiredCredits = calculateRequiredCredits(requestedQuestions.value, currentGameMode);
				throw new Error(`Insufficient credits! You need ${requiredCredits} credits to play.`);
			}

			// Deduct credits before starting the game (skip for admin users)
			if (!isAdmin) {
				await new Promise<void>((resolve, reject) => {
					deductCredits(
						{
							requestedQuestions: requestedQuestions.value,
							gameMode: currentGameMode,
						},
						{
							onSuccess: () => {
								logger.gameInfo('Credits deducted successfully', { requestedQuestions: requestedQuestions.value });
								resolve();
							},
							onError: error => {
								logger.gameError('Failed to deduct credits', { error: getErrorMessage(error) });
								reject(new Error('Failed to deduct credits. Please try again.'));
							},
						}
					);
				});
			} else {
				logger.gameInfo('Admin user - skipping credit deduction', { requestedQuestions: requestedQuestions.value });
			}

			if (isCustomDifficulty(difficulty)) {
				await validateCustomDifficulty(`${topic} ${difficulty}`);
			}

			const response = await triviaMutation.mutateAsync({
				topic,
				difficulty: difficulty,
				requestedQuestions: requestedQuestions.value,
				userId: userId,
			});

			updateGameState({
				trivia: response,
				loading: false,
				selected: null,
				gameMode: {
					...gameState.gameMode,
					mode: currentGameMode,
					isGameOver: false,
					timer: {
						...gameState.gameMode?.timer,
						isRunning: true,
						startTime: Date.now(),
						timeElapsed: 0,
						timeRemaining:
							currentGameMode === GameMode.TIME_LIMITED
								? (gameState.gameMode?.timeLimit ?? gameModeDefaults.timeLimit)
								: undefined,
					},
				},
			});
			setIsGameActive(true);
			audioService.play(AudioKey.GAME_START);
			audioService.play(AudioKey.GAME_MUSIC);
		} catch (err) {
			const userFriendlyMessage = formatValidationErrorMessage(err);

			updateGameState({
				error: userFriendlyMessage,
				loading: false,
			});
			setIsGameActive(false);
			audioService.play(AudioKey.ERROR);
		}
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();

		audioService.play(AudioKey.BUTTON_CLICK);

		logger.gameForm('Trivia form submitted', {
			topic: topic.substring(0, 50) + (topic.length > 50 ? '...' : ''),
			difficulty,
			requestedQuestions: requestedQuestions.value,
			isGameActive,
			formValid: isFormValid,
			timestamp: new Date().toISOString(),
		});

		if (!isGameActive || !gameState.trivia) {
			logger.gameGamepad('Game mode selector opened', {
				reason: 'new_game_start',
			});
			audioService.play(AudioKey.MENU_OPEN);
			setShowGameModeSelector(true);
			return;
		}

		await startGame();
	};

	const handleGameEnd = useCallback(async () => {
		audioService.play(AudioKey.GAME_END);

		// Save custom difficulty to history with final score
		const currentTopic = gameState.config?.topic ?? topic;
		const currentDifficulty = gameState.config?.difficulty ?? difficulty;
		const finalScore = gameState.stats?.currentScore ?? 0;

		if (isCustomDifficulty(currentDifficulty) && currentTopic) {
			try {
				await customDifficultyService.addToHistory(currentTopic, currentDifficulty, finalScore);
			} catch (error) {
				logger.storageError('Failed to update custom difficulty history with score', {
					error: getErrorMessage(error),
				});
			}
		}

		updateGameState({
			gameMode: {
				...gameState.gameMode,
				mode: currentGameMode,
				isGameOver: true,
				timer: {
					...gameState.gameMode?.timer,
					isRunning: false,
					startTime: gameState.gameMode?.timer?.startTime ?? null,
					timeElapsed: gameState.gameMode?.timer?.timeElapsed ?? 0,
					timeRemaining: gameState.gameMode?.timer?.timeRemaining,
				},
			},
		});
		setIsGameActive(false);
		dispatch(resetGame());
	}, [
		gameState.gameMode,
		gameState.config,
		gameState.stats,
		currentGameMode,
		topic,
		difficulty,
		updateGameState,
		dispatch,
		audioService,
	]);

	// Use centralized game timer hook for automatic timer management
	// This hook handles all timer updates, game over detection, and time warnings
	useGameTimer(gameState.gameMode, updateGameState, gameState, handleGameEnd);

	const loadNextQuestion = useCallback(async () => {
		if (gameState.gameMode?.isGameOver) return;
		updateGameState({ loading: true });
		try {
			// For unlimited mode, request questions in batches (don't deduct credits again)
			// For limited modes, use the original requestedQuestions value
			const questionsToRequest = currentGameMode === GameMode.UNLIMITED ? 1 : requestedQuestions.value;

			const response = await triviaMutation.mutateAsync({
				topic,
				difficulty: difficulty,
				requestedQuestions: questionsToRequest,
				userId: userId,
			});
			const updatedQuestionLimit =
				currentGameMode === GameMode.QUESTION_LIMITED
					? (gameState.gameMode?.questionLimit ?? 0) - 1
					: gameState.gameMode?.questionLimit;

			updateGameState({
				trivia: response,
				loading: false,
				selected: null,
				gameMode: {
					...gameState.gameMode,
					mode: currentGameMode,
					isGameOver: gameState.gameMode?.isGameOver ?? false,
					timer: gameState.gameMode?.timer ?? {
						isRunning: false,
						startTime: null,
						timeElapsed: 0,
						timeRemaining: currentGameMode === GameMode.TIME_LIMITED ? gameState.gameMode?.timeLimit : undefined,
					},
					questionLimit: updatedQuestionLimit,
				},
			});
		} catch (err: unknown) {
			updateGameState({
				error: getErrorMessage(err),
				loading: false,
			});
		}
	}, [
		topic,
		difficulty,
		userId,
		currentGameMode,
		gameState.gameMode,
		requestedQuestions,
		updateGameState,
		triviaMutation,
	]);

	const gameContextValue = {
		gameState,
		updateGameState,
		handleAnswer,
		loadNextQuestion,
		handleGameEnd,
	};

	return (
		<GameContext.Provider value={gameContextValue}>
			<section aria-label='Game Interface' className='min-h-screen flex flex-col items-center justify-center p-4 pt-12'>
				{/* Main Content Container */}
				<motion.section
					variants={scaleIn}
					initial='hidden'
					animate='visible'
					exit='exit'
					className='w-full max-w-7xl glass-morphism rounded-lg p-6 mx-auto'
					transition={{ delay: 0.8 }}
					aria-label='Main Game Content'
				>
					{/* Title Section */}
					<HomeTitle title='EveryTriv' className='text-center mb-8' />

					{/* App Description */}
					<motion.p
						variants={fadeInUp}
						initial='hidden'
						animate='visible'
						exit='exit'
						transition={{ delay: 0.4 }}
						className='text-center mb-6 text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed'
					>
						Test your knowledge with our interactive trivia game
					</motion.p>

					{/* Current Difficulty Display */}
					<DifficultyDisplay
						className='text-center mb-6'
						topic={topic}
						difficulty={difficulty}
						onDifficultyChange={updateDifficultySelection}
						onShowHistory={() => setShowHistory(true)}
					/>

					{/* Trivia Form */}
					<motion.section
						variants={fadeInUp}
						initial='hidden'
						animate='visible'
						exit='exit'
						transition={{ delay: 0.6 }}
						aria-label='Trivia Selection Form'
					>
						<TriviaForm
							topic={topic}
							difficulty={difficulty}
							answerCount={4}
							loading={gameState.loading}
							onTopicChange={setTopic}
							onDifficultyChange={updateDifficultySelection}
							onAnswerCountChange={() => {
								// Store answer count for trivia generation
								// This is the number of answer choices per question (3|4|5)
								// Currently not used, but kept for future use
							}}
							onSubmit={handleSubmit}
						/>
					</motion.section>

					{/* Popular Topics Suggestions */}
					{!topic && (
						<motion.section
							variants={fadeInUp}
							initial='hidden'
							animate='visible'
							exit='exit'
							transition={{ delay: 0.7 }}
							className='mt-4 space-y-3'
							aria-label='Popular Topics'
						>
							<header className='text-center'>
								<h3 className='text-sm font-medium text-white/80'>Popular Topics</h3>
							</header>
							<ResponsiveGrid gap={Spacing.SM} className='max-w-5xl mx-auto'>
								{['Science', 'History', 'Sports', 'Music', 'Movies', 'Geography', 'Art', 'Technology'].map(
									(suggestedTopic: string, index: number) => (
										<motion.button
											key={suggestedTopic}
											variants={hoverScale}
											initial='hidden'
											animate='visible'
											exit='exit'
											custom={index * 0.05}
											onClick={() => {
												setTopic(suggestedTopic);
												audioService.play(AudioKey.BUTTON_CLICK);
											}}
											className='px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white/90 hover:text-white transition-all duration-200 backdrop-blur-sm text-center'
										>
											{suggestedTopic}
										</motion.button>
									)
								)}
							</ResponsiveGrid>
						</motion.section>
					)}

					{/* Favorite Topics */}
					<motion.section
						variants={fadeInUp}
						initial='hidden'
						animate='visible'
						exit='exit'
						transition={{ delay: 0.8 }}
						aria-label='Favorite Topics'
					>
						<FavoriteTopics favorites={gameState.favorites ?? []} onRemove={removeFavorite} onSelect={selectFavorite} />
					</motion.section>

					{/* Error Display */}
					<ErrorBanner message={gameState.error || ''} />

					{/* Active Game */}
					{gameState.trivia && (
						<motion.article
							variants={scaleIn}
							initial='hidden'
							animate='visible'
							exit='exit'
							transition={{ delay: 0.5 }}
							aria-label='Active Trivia Game'
						>
							<Game
								state={gameState}
								onStateChange={updateGameState}
								trivia={gameState.trivia}
								selected={gameState.selected}
								onNewQuestion={loadNextQuestion}
								gameMode={gameState.gameMode}
								onGameEnd={handleGameEnd}
							/>
						</motion.article>
					)}
				</motion.section>

				{/* Scoring Section - Only shown when there's active game or stats */}
				{(isGameActive || (gameState.stats?.questionsAnswered ?? 0) > 0) && (
					<motion.section
						variants={createStaggerContainer(0.1)}
						initial='hidden'
						animate='visible'
						exit='exit'
						className='w-full max-w-7xl mt-8 space-y-6'
						aria-label='Scoring System'
					>
						{/* Score Change Indicator */}
						{scoreChange.hasChanged && (
							<motion.div
								variants={fadeInUp}
								initial='hidden'
								animate='visible'
								exit='exit'
								transition={{ delay: 0.1 }}
								role='status'
								aria-live='polite'
							>
								<div className='text-center'>
									<div
										className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
											(scoreChange.current ?? 0) > (scoreChange.previous ?? 0)
												? 'bg-green-500/20 text-green-300 border border-green-400/30'
												: 'bg-red-500/20 text-red-300 border border-red-400/30'
										}`}
									>
										<Icon
											name={(scoreChange.current ?? 0) > (scoreChange.previous ?? 0) ? 'trending-up' : 'trending-down'}
											size={ComponentSize.SM}
											className='mr-2'
										/>
										Score {(scoreChange.current ?? 0) > (scoreChange.previous ?? 0) ? 'increased' : 'decreased'} by{' '}
										{Math.abs((scoreChange.current ?? 0) - (scoreChange.previous ?? 0))}
									</div>
								</div>
							</motion.div>
						)}

						<GridLayout variant='balanced' gap={Spacing.LG}>
							<motion.article
								variants={fadeInRight}
								initial='hidden'
								animate='visible'
								exit='exit'
								className='col-span-2'
								aria-label='Scoring System'
							>
								<ScoringSystem
									currentStreak={gameState.stats?.correctStreak ?? 0}
									score={gameState.stats?.currentScore ?? 0}
									total={gameState.stats?.questionsAnswered ?? 0}
									topicsPlayed={Object.keys(gameState.stats?.topicsPlayed ?? {})}
									difficultyStats={gameState.stats?.successRateByDifficulty}
									currentQuestionMetadata={currentQuestionMetadata}
								/>
							</motion.article>

							{/* Social Share Component */}
							{(gameState.stats?.questionsAnswered ?? 0) > 0 && (
								<motion.aside
									variants={fadeInRight}
									initial='hidden'
									animate='visible'
									exit='exit'
									className='col-span-1'
									aria-label='Social Sharing'
								>
									<SocialShare
										score={gameState.stats?.currentScore ?? 0}
										total={gameState.stats?.questionsAnswered ?? 0}
										topic={topic}
										difficulty={difficulty}
										className='w-full'
									/>
								</motion.aside>
							)}
						</GridLayout>
					</motion.section>
				)}

				{/* Modals */}
				<CustomDifficultyHistory
					isVisible={showHistory}
					onSelect={selectFromHistory}
					onClose={() => setShowHistory(false)}
				/>
				<GameModeComponent
					isVisible={showGameModeSelector}
					onSelectMode={handleGameModeSelect}
					onModeSelect={(mode: string) => logger.gameInfo('Game mode selected', { mode })}
					onCancel={() => setShowGameModeSelector(false)}
				/>
			</section>
		</GameContext.Provider>
	);
}
