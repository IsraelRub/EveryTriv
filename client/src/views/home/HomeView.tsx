import { createContext, FormEvent, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { motion } from 'framer-motion';

import { DifficultyLevel, GameMode } from '@shared/constants';
import { clientLogger as logger } from '@shared/services';
import type { FavoriteTopic, GameDifficulty } from '@shared/types';
import { getErrorMessage } from '@shared/utils';
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
	Leaderboard,
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
	GAME_MODE_DEFAULTS,
	GAME_STATE_UPDATES,
	Spacing,
	UNLIMITED_QUESTIONS,
} from '../../constants';
import {
	useAppDispatch,
	useAppSelector,
	useCanPlay,
	useDeductPoints,
	useGameTimer,
	usePrevious,
	useSaveHistory,
	useTriviaQuestionMutation,
	useUserProfile,
	useValidateCustomDifficulty,
	useValueChange,
} from '../../hooks';
import { selectCurrentDifficulty, selectCurrentGameMode, selectCurrentTopic } from '../../redux/selectors';
import { resetGame } from '../../redux/slices';
import { audioService, storageService } from '../../services';
import type {
	ClientGameState,
	CurrentQuestionMetadata,
	GameConfig,
	GameSessionData,
	QuestionCountOption,
} from '../../types';
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
	const gameMode = useAppSelector(selectCurrentGameMode);
	const currentTopic = useAppSelector(selectCurrentTopic);
	const currentDifficulty = useAppSelector(selectCurrentDifficulty);

	const { data: userProfileResponse } = useUserProfile();

	const [topic, setTopic] = useState('');
	const [difficulty, setDifficulty] = useState<GameDifficulty>(DifficultyLevel.MEDIUM);

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

	const gameModeConfig = useMemo(() => {
		const defaults = GAME_MODE_DEFAULTS[gameMode];

		const getDefaultQuestionCount = (): QuestionCountOption => {
			const count = defaults.questionLimit;

			return {
				value: count,
				label: count === UNLIMITED_QUESTIONS ? 'Unlimited Questions' : `${count} Questions`,
			};
		};

		return {
			questionCount: getDefaultQuestionCount(),
			timeLimit: defaults.timeLimit,
			questionLimit: defaults.questionLimit,
			timeRemaining: defaults.timeLimit,
		};
	}, [gameMode]);

	const [questionCount, setQuestionCount] = useState<QuestionCountOption>(() => gameModeConfig.questionCount);
	const [gameState, setGameState] = useState<ClientGameState>(DEFAULT_GAME_STATE);
	const [userId, setUserId] = useState<string>('');
	const [showHistory, setShowHistory] = useState(false);
	const [isGameActive, setIsGameActive] = useState(false);
	const [showGameModeSelector, setShowGameModeSelector] = useState(false);

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
			questionCount: metadata.usageCount,
		};
	}, [gameState.trivia?.metadata]);

	const addParticleBurst = (x: number, y: number, type: string) => {
		logger.logUserActivity('particleBurst', `x: ${x}, y: ${y}, type: ${type}`);
	};

	const triviaMutation = useTriviaQuestionMutation();
	const saveHistoryMutation = useSaveHistory();
	const validateCustomDifficulty = useValidateCustomDifficulty();

	// Points hooks for game start
	const { data: canPlay } = useCanPlay(questionCount.value);
	const { mutate: deductPoints } = useDeductPoints();

	const isFormValid = topic.trim().length > 0 && difficulty.trim().length > 0;
	const validationErrors: string[] = [];
	const isValidating = false;

	const setHookGameMode = (config: GameConfig) => {
		logger.logUserActivity('gameModeChanged', JSON.stringify(config));
	};

	const updateSessionData = (data: GameSessionData) => {
		logger.logUserActivity('sessionUpdated', JSON.stringify(data));
	};

	const createGameModeConfig = useCallback(
		(
			mode: GameMode,
			config: { timeLimit: number; questionLimit: number; timeRemaining: number },
			existingGameMode?: ClientGameState['gameMode']
		): ClientGameState['gameMode'] => {
			return {
				mode,
				timer: {
					isRunning: false,
					startTime: null,
					timeElapsed: 0,
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
		setGameState((prev: ClientGameState) => ({
			...prev,
			gameMode: createGameModeConfig(gameMode, gameModeConfig, prev.gameMode),
		}));

		if (currentTopic) setTopic(currentTopic);
		if (currentDifficulty) setDifficulty(currentDifficulty);

		setQuestionCount(gameModeConfig.questionCount);
	}, [gameMode, currentTopic, currentDifficulty, gameModeConfig, createGameModeConfig]);

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
					audioService.play(AudioKey.POINT_EARNED);
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
		setDifficulty(historyDifficulty as GameDifficulty);
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
				addParticleBurst(0, 0, 'correct-answer');
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

			const sessionCurrentScore = (gameState.stats?.currentScore ?? 0) + (isCorrect ? 1 : 0);
			const sessionQuestionsAnswered = (gameState.stats?.questionsAnswered ?? 0) + 1;

			updateSessionData({
				sessionId: '',
				startTime: new Date(),
				stats: {
					currentScore: sessionCurrentScore,
					maxScore: sessionQuestionsAnswered,
					successRate: (sessionCurrentScore / sessionQuestionsAnswered) * 100,
					averageTimePerQuestion: 1000,
					correctStreak: isCorrect ? (gameState.stats?.correctStreak ?? 0) + 1 : 0,
					maxStreak: Math.max(
						gameState.stats?.maxStreak ?? 0,
						isCorrect ? (gameState.stats?.correctStreak ?? 0) + 1 : 0
					),
					questionsAnswered: sessionQuestionsAnswered,
					correctAnswers: (gameState.stats?.correctAnswers ?? 0) + (isCorrect ? 1 : 0),
					totalGames: gameState.stats?.totalGames ?? 0,
				},
				lastGameMode: gameState.gameMode?.mode ?? null,
				sessionCount: 1,
				lastScore: sessionCurrentScore,
				lastTimeElapsed: gameState.gameMode?.timer?.timeElapsed ?? 0,
			});

			if (gameState.gameMode?.mode !== 'time-limited' && gameState.gameMode?.mode !== 'question-limited') {
				setTimeout(() => {
					setIsGameActive(false);
				}, GAME_STATE_UPDATES.ANIMATION_DELAYS.ANSWER_FEEDBACK);
			}
		},
		[
			gameState,
			userId,
			updateStats,
			updateGameState,
			saveHistoryMutation,
			updateSessionData,
			addParticleBurst,
			audioService,
		]
	);

	const handleGameModeSelect = (config: { mode: GameMode; timeLimit?: number; questionLimit?: number }) => {
		audioService.play(AudioKey.BUTTON_CLICK);
		setHookGameMode({
			mode: gameMode,
			topic: topic,
			difficulty: difficulty,
			timeLimit: config.timeLimit,
			questionLimit: config.questionLimit,
			settings: {
				showTimer: true,
				showProgress: true,
				allowBackNavigation: false,
			},
		});

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
		handleSubmitWithMode();
	};

	const handleSubmitWithMode = async () => {
		updateGameState({ error: '', loading: true });
		try {
			if (!isFormValid) {
				throw new Error(validationErrors.join(', '));
			}

			// Check if user has enough points to play
			if (!canPlay) {
				throw new Error(`Insufficient points! You need ${questionCount.value} points to play.`);
			}

			// Deduct points before starting the game
			await new Promise<void>((resolve, reject) => {
				deductPoints(
					{
						questionCount: questionCount.value,
						gameMode: gameState.gameMode?.mode ?? GameMode.QUESTION_LIMITED,
					},
					{
						onSuccess: () => {
							logger.gameInfo('Points deducted successfully', { questionCount: questionCount.value });
							resolve();
						},
						onError: error => {
							logger.gameError('Failed to deduct points', { error: getErrorMessage(error) });
							reject(new Error('Failed to deduct points. Please try again.'));
						},
					}
				);
			});

			if (isCustomDifficulty(difficulty)) {
				await validateCustomDifficulty(`${topic} ${difficulty}`);
			}

			const response = await triviaMutation.mutateAsync({
				topic,
				difficulty: difficulty,
				questionCount: questionCount.value,
				userId: userId,
			});

			updateGameState({
				trivia: response,
				loading: false,
				selected: null,
				gameMode: {
					...gameState.gameMode,
					mode: gameState.gameMode?.mode ?? GameMode.UNLIMITED,
					isGameOver: false,
					timer: {
						...gameState.gameMode?.timer,
						isRunning: true,
						startTime: Date.now(),
						timeElapsed: 0,
					},
				},
			});
			setIsGameActive(true);
			audioService.play(AudioKey.GAME_START);
			audioService.play(AudioKey.GAME_MUSIC);
		} catch (err: unknown) {
			const errorMessage = getErrorMessage(err);
			updateGameState({
				error: errorMessage,
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
			questionCount: typeof questionCount === 'number' ? questionCount : undefined,
			isGameActive,
			formValid: isFormValid,
			timestamp: new Date().toISOString(),
		});

		if (!isGameActive) {
			logger.gameGamepad('Game mode selector opened', {
				reason: 'new_game_start',
			});
			audioService.play(AudioKey.MENU_OPEN);
			setShowGameModeSelector(true);
			return;
		}

		await handleSubmitWithMode();
	};

	const handleGameEnd = useCallback(() => {
		audioService.play(AudioKey.GAME_END);
		updateGameState({
			gameMode: {
				...gameState.gameMode,
				mode: gameState.gameMode?.mode ?? GameMode.UNLIMITED,
				isGameOver: true,
				timer: {
					...gameState.gameMode?.timer,
					isRunning: false,
					startTime: gameState.gameMode?.timer?.startTime ?? null,
					timeElapsed: gameState.gameMode?.timer?.timeElapsed ?? 0,
				},
			},
		});
		setIsGameActive(false);
		dispatch(resetGame());
	}, [gameState.gameMode, updateGameState, dispatch, audioService]);

	// Use centralized game timer hook for automatic timer management
	// This hook handles all timer updates, game over detection, and time warnings
	useGameTimer(gameState.gameMode, updateGameState, gameState, handleGameEnd);

	const startNewGame = useCallback(() => {
		audioService.play(AudioKey.GAME_START);
		setShowGameModeSelector(true);
	}, [audioService]);

	const loadNextQuestion = useCallback(async () => {
		if (gameState.gameMode?.isGameOver) return;
		updateGameState({ loading: true });
		try {
			const response = await triviaMutation.mutateAsync({
				topic,
				difficulty: difficulty,
				questionCount: questionCount.value,
				userId: userId,
			});
			updateGameState({
				trivia: response,
				loading: false,
				selected: null,
				gameMode: {
					...gameState.gameMode,
					mode: gameState.gameMode?.mode ?? GameMode.UNLIMITED,
					isGameOver: gameState.gameMode?.isGameOver ?? false,
					timer: gameState.gameMode?.timer ?? { isRunning: false, startTime: null, timeElapsed: 0 },
					questionLimit:
						gameState.gameMode?.mode === 'question-limited'
							? (gameState.gameMode?.questionLimit ?? 0) - 1
							: gameState.gameMode?.questionLimit,
				},
			});
		} catch (err: unknown) {
			updateGameState({
				error: getErrorMessage(err),
				loading: false,
			});
		}
	}, [topic, difficulty, userId, gameState.gameMode, updateGameState, triviaMutation]);

	const gameContextValue = {
		gameState,
		updateGameState,
		handleAnswer,
		loadNextQuestion,
		handleGameEnd,
	};

	return (
		<GameContext.Provider value={gameContextValue}>
			<main
				role='main'
				aria-label='Game Interface'
				className='min-h-screen flex flex-col items-center justify-center p-4 pt-12'
			>
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
						onDifficultyChange={(difficulty: string) => setDifficulty(difficulty as GameDifficulty)}
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
							questionCount={questionCount.value}
							loading={gameState.loading || isValidating}
							onTopicChange={setTopic}
							onDifficultyChange={(difficulty: string) => setDifficulty(difficulty as GameDifficulty)}
							onQuestionCountChange={(count: number) => setQuestionCount({ value: count, label: `${count} Questions` })}
							onSubmit={handleSubmit}
							showGameModeSelector={showGameModeSelector}
							onGameModeSelectorClose={() => setShowGameModeSelector(false)}
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
							<ResponsiveGrid minWidth='100px' gap={Spacing.SM} className='max-w-5xl mx-auto'>
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

					{/* Game Mode Button */}
					{!gameState.loading && !gameState.trivia && (
						<motion.section
							variants={fadeInUp}
							initial='hidden'
							animate='visible'
							exit='exit'
							transition={{ delay: 1 }}
							className='mt-6'
							aria-label='Game Mode Selection'
						>
							<motion.button
								variants={hoverScale}
								initial='hidden'
								animate='visible'
								exit='exit'
								onClick={() => {
									audioService.play(AudioKey.BUTTON_CLICK);
									startNewGame();
								}}
								className='w-full py-4 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transform hover:scale-105 transition-all duration-200'
							>
								<Icon name='gamepad' size={ComponentSize.LG} className='mr-2' />
								Start Game with Options
							</motion.button>
						</motion.section>
					)}

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

				{/* Scoring and Leaderboard Section */}
				<motion.section
					variants={createStaggerContainer(0.1)}
					initial='hidden'
					animate='visible'
					exit='exit'
					className='w-full max-w-7xl mt-8 space-y-6'
					aria-label='Scoring and Leaderboard'
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

					<Leaderboard userId={userId} />
				</motion.section>

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
			</main>
		</GameContext.Provider>
	);
}
