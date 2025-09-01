import { DifficultyLevel } from 'everytriv-shared/constants';
import { GameMode } from 'everytriv-shared/constants/game.constants';
import { motion } from 'framer-motion';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

// Animation components
import { FadeInRight, FadeInUp, HoverScale, ScaleIn, StaggerContainer } from '../../components/animations';
// Component imports
import { Game, TriviaForm } from '../../components/game';
import { GameMode as GameModeComponent } from '../../components/gameMode';
import { CurrentDifficulty, ErrorBanner, HomeTitle } from '../../components/home';
// Icon imports
import { Icon } from '../../components/icons';
import { SocialShare } from '../../components/layout';
import { Leaderboard } from '../../components/leaderboard';
import { CustomDifficultyHistory, ScoringSystem } from '../../components/stats';
import { Button } from '../../components/ui';
import { FavoriteTopics } from '../../components/user';
import { APP_DESCRIPTION, POPULAR_TOPICS } from '../../constants';
// Constants
import { DEFAULT_GAME_STATE, GAME_STATE_UPDATES } from '../../constants';
import { AudioKey } from '../../constants/audio.constants';
// Hook imports - using real hooks instead of mocks
import { useSaveHistory, useTriviaQuestionMutation, useValidateCustomDifficulty } from '../../hooks/api/useTrivia';
import { useScoreAchievementSounds } from '../../hooks/layers/audio/useScoreAchievementSounds';
import { useGameMode, useGameSession } from '../../hooks/layers/business/useGameLogic';
import { useOptimizedAnimations } from '../../hooks/layers/ui/useOptimizedAnimations';
import { usePrevious, useValueChange } from '../../hooks/layers/utils/usePrevious';
import { selectGameMode } from '../../redux/features/gameModeSlice';
import { resetGame } from '../../redux/features/gameSlice';
import { loggerService } from '../../services';
import { AudioService } from '../../services/media/audio.service';
import { storageService } from '../../services/storage/storage.service';
import { GameState, getOrCreateClientUserId, QuestionCountOption } from '../../types';
import { isCustomDifficulty } from '../../utils';

export default function HomeView() {
	const dispatch = useDispatch();
	const gameMode = useSelector(selectGameMode);

	const [topic, setTopic] = useState('');
	const [difficulty, setDifficulty] = useState(DifficultyLevel.MEDIUM);
	const [questionCount, setQuestionCount] = useState<QuestionCountOption>({ value: 4, label: '4 Questions' });
	const [gameState, setGameState] = useState<GameState>(DEFAULT_GAME_STATE);
	const [userId] = useState(() => getOrCreateClientUserId());
	const [showHistory, setShowHistory] = useState(false);
	const [isGameActive, setIsGameActive] = useState(false);
	const [showGameModeSelector, setShowGameModeSelector] = useState(false);

	// Track previous values for better UX
	const previousScore = usePrevious(gameState.score);
	const scoreChange = useValueChange(gameState.score);

	// Initialize audio service
	const audioService = new AudioService();

	// Use real hooks instead of mocks
	useScoreAchievementSounds(gameState.score, gameState.total);
	const { addParticleBurst } = useOptimizedAnimations(gameState.score, {
		enableParticles: true,
		enableScoreAnimations: true,
		particleLimit: 100,
	});

	// Use trivia hooks
	const triviaMutation = useTriviaQuestionMutation();
	const saveHistoryMutation = useSaveHistory();
	const validateCustomDifficulty = useValidateCustomDifficulty();

	// Validation state (simplified)
	const isFormValid = topic.trim().length > 0 && difficulty.trim().length > 0;
	const validationErrors: string[] = [];
	const isValidating = false;

	// Use game logic hooks
	const { setGameMode: setHookGameMode } = useGameMode();
	const { updateSessionData } = useGameSession();

	// Sync Redux gameMode with local state
	useEffect(() => {
		setGameState((prev) => ({
			...prev,
			gameMode: {
				mode: gameMode.currentMode,
				isGameOver: false,
				timer: {
					isRunning: false,
					startTime: null,
					timeElapsed: 0,
				},
				questionsRemaining: undefined,
				timeLimit: undefined,
				questionLimit: undefined,
				timeRemaining: gameMode.timeRemaining,
			},
		}));
	}, [gameMode]);

	// Log component mounting and score changes
	useEffect(() => {
		loggerService.navigationPage('home');
		return () => {
			loggerService.navigationPage('home-exit');
		};
	}, []);

	// Log score changes for analytics and save to storage
	useEffect(() => {
		if (scoreChange.hasChanged && previousScore !== undefined) {
			loggerService.game('Score changed', {
				previousScore,
				newScore: gameState.score,
				change: gameState.score - previousScore,
			});

			// Save score history to storage
			storageService.setItem('score_history', {
				score: gameState.score,
				topic,
				difficulty,
				timestamp: Date.now(),
			});

			// Play sound effect based on score change
			if (gameState.score > previousScore) {
				audioService.play(AudioKey.POINT_EARNED);
			} else if (gameState.score < previousScore) {
				audioService.play(AudioKey.ERROR);
			}
		}
	}, [scoreChange.hasChanged, previousScore, gameState.score, topic, difficulty]);

	const updateGameState = useCallback((updates: Partial<GameState>) => {
		setGameState((prev) => ({ ...prev, ...updates }));
	}, []);

	const removeFavorite = useCallback(
		(i: number) => {
			updateGameState({
				favorites: gameState.favorites.filter((_, idx) => idx !== i),
			});
		},
		[gameState.favorites, updateGameState]
	);

	// פונקציה חדשה לטיפול בבחירת מועדף
	const selectFavorite = useCallback((favorite: { topic: string; difficulty: string }) => {
		setTopic(favorite.topic);
		setDifficulty(favorite.difficulty as DifficultyLevel);
	}, []);

	// פונקציה חדשה לטיפול בבחירה מההיסטוריה
	const selectFromHistory = useCallback((historyTopic: string, historyDifficulty: string) => {
		setTopic(historyTopic);
		setDifficulty(historyDifficulty as DifficultyLevel);
	}, []);

	const updateStats = useCallback(
		(topic: string, difficulty: string, isCorrect: boolean) => {
			const { stats } = gameState;

			const statsDifficulty = isCustomDifficulty(difficulty) ? 'custom' : difficulty;

			return {
				topicsPlayed: {
					...stats.topicsPlayed,
					[topic]: (stats.topicsPlayed[topic] || 0) + 1,
				},
				successRateByDifficulty: {
					...stats.successRateByDifficulty,
					[statsDifficulty]: {
						correct: (stats.successRateByDifficulty[statsDifficulty]?.correct || 0) + (isCorrect ? 1 : 0),
						total: (stats.successRateByDifficulty[statsDifficulty]?.total || 0) + 1,
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
			const newStats = updateStats(gameState.trivia.topic, gameState.trivia.difficulty, isCorrect);

			// Add particle effect and play sound for correct answers
			if (isCorrect) {
				addParticleBurst(0, 0, {
					count: GAME_STATE_UPDATES.PARTICLE_EFFECTS.CORRECT_ANSWER.count,
					colors: GAME_STATE_UPDATES.PARTICLE_EFFECTS.CORRECT_ANSWER.colors,
					life: {
						min: GAME_STATE_UPDATES.PARTICLE_EFFECTS.CORRECT_ANSWER.life,
						max: GAME_STATE_UPDATES.PARTICLE_EFFECTS.CORRECT_ANSWER.life,
					},
				});
				audioService.play(AudioKey.CORRECT_ANSWER);
			} else {
				audioService.play(AudioKey.WRONG_ANSWER);
			}

			updateGameState({
				selected: i,
				total: gameState.total + 1,
				score: gameState.score + (isCorrect ? 1 : 0),
				stats: {
					...gameState.stats,
					...newStats,
				},
			});

			// Use mutation hook instead of direct API call
			await saveHistoryMutation.mutateAsync({
				userId,
				score: gameState.score + (isCorrect ? 1 : 0),
				totalQuestions: 1,
				correctAnswers: isCorrect ? 1 : 0,
				difficulty: gameState.trivia.difficulty,
				topic: gameState.trivia.topic,
				gameMode: 'single',
				timeSpent: gameState.gameMode.timer.timeElapsed || 0,
				creditsUsed: 1,
				questionsData: [
					{
						question: gameState.trivia.question,
						userAnswer: gameState.trivia.answers[i]?.text || '',
						correctAnswer: gameState.trivia.answers[gameState.trivia.correct_answer_index]?.text || '',
						isCorrect,
						timeSpent: gameState.gameMode.timer.timeElapsed || 0,
					},
				],
			});

			// Update session data
			updateSessionData({
				lastScore: gameState.score + (isCorrect ? 1 : 0),
				lastTimeElapsed: gameState.gameMode.timer.timeElapsed || 0,
			});

			// For game modes that continue automatically, don't set inactive
			if (gameState.gameMode.mode === GameMode.TIME_LIMITED || gameState.gameMode.mode === GameMode.QUESTION_LIMITED) {
				// Game continues automatically - handled by Game component
			} else {
				// For unlimited mode or if we're not in a game mode, set inactive after delay
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

	// Handle game mode selection
	const handleGameModeSelect = (config: { mode: GameMode; timeLimit?: number; questionLimit?: number }) => {
		// Play sound effect for game mode selection
		audioService.play(AudioKey.BUTTON_CLICK);
		// Use hook instead of direct state update
		setHookGameMode(config);

		updateGameState({
			gameMode: {
				...gameState.gameMode,
				mode: config.mode,
				timeLimit: config.timeLimit,
				questionLimit: config.questionLimit,
				questionsRemaining: config.questionLimit,
				timeRemaining: config.timeLimit,
				isGameOver: false,
				timer: {
					isRunning: false,
					startTime: null,
					timeElapsed: 0,
				},
			},
		});
		// Start the game after mode selection
		audioService.play(AudioKey.MENU_CLOSE);
		setShowGameModeSelector(false);
		// Start fetching the first question
		handleSubmitWithMode();
	};

	const handleSubmitWithMode = async () => {
		updateGameState({ error: '', loading: true });
		try {
			// Use validation hook instead of manual validation
			if (!isFormValid) {
				throw new Error(validationErrors.join(', '));
			}

			if (isCustomDifficulty(difficulty)) {
				await validateCustomDifficulty(`${topic} ${difficulty}`);
			}

			// Use mutation hook instead of direct API call
			const response = await triviaMutation.mutateAsync({
				topic,
				difficulty,
				question_count: questionCount.value,
				user_id: userId,
			});

			updateGameState({
				trivia: response,
				loading: false,
				selected: null,
				gameMode: {
					...gameState.gameMode,
					timer: {
						...gameState.gameMode.timer,
						isRunning: true,
						startTime: gameState.gameMode.timer.startTime || Date.now(),
					},
				},
			});
			// Set game active state to true when trivia is loaded
			setIsGameActive(true);
			// Play game start sound
			audioService.play(AudioKey.GAME_START);
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : 'An error occurred';
			updateGameState({
				error: errorMessage,
				loading: false,
			});
			setIsGameActive(false);
			// Play error sound
			audioService.play(AudioKey.ERROR);
		}
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();

		// Play sound effect for form submission
		audioService.play(AudioKey.BUTTON_CLICK);

		loggerService.gameForm('Trivia form submitted', {
			topic: topic.substring(0, 50) + (topic.length > 50 ? '...' : ''),
			difficulty,
			questionCount,
			isGameActive,
			formValid: isFormValid,
			timestamp: new Date().toISOString(),
		});

		// Show game mode selection if not already active
		if (!isGameActive) {
			loggerService.gameGamepad('Game mode selector opened', {
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
				isGameOver: true,
				timer: {
					...gameState.gameMode.timer,
					isRunning: false,
				},
			},
		});
		setIsGameActive(false);
		dispatch(resetGame());
	}, [gameState.gameMode, updateGameState, dispatch, audioService]);

	// Start a new game with current settings
	const startNewGame = useCallback(() => {
		audioService.play(AudioKey.GAME_START);
		setShowGameModeSelector(true);
	}, [audioService]);

	// Load a new question during an active game
	const loadNextQuestion = useCallback(async () => {
		if (gameState.gameMode.isGameOver) return;
		updateGameState({ loading: true });
		try {
			// Use mutation hook instead of direct API call
			const response = await triviaMutation.mutateAsync({
				topic,
				difficulty,
				question_count: questionCount.value,
				user_id: userId,
			});
			// Update game state with new question and decrement question count if needed
			updateGameState({
				trivia: response,
				loading: false,
				selected: null,
				gameMode: {
					...gameState.gameMode,
					questionsRemaining:
						gameState.gameMode.mode === GameMode.QUESTION_LIMITED && gameState.gameMode.questionsRemaining
							? gameState.gameMode.questionsRemaining - 1
							: undefined,
				},
			});
		} catch (err: unknown) {
			updateGameState({
				error: err instanceof Error ? err.message : 'An error occurred',
				loading: false,
			});
		}
	}, [topic, difficulty, userId, gameState.gameMode, updateGameState, triviaMutation]);

	// Title and current difficulty UI moved to dedicated components for clarity

	return (
		<div className='min-h-screen flex flex-col items-center justify-center p-4 pt-20'>
			{/* Main Content Container */}
			<ScaleIn className='w-full max-w-4xl glass-morphism rounded-lg p-6 mx-auto' delay={0.8}>
				{/* Title Section */}
				<HomeTitle className='text-center mb-8' />

				{/* App Description */}
				<FadeInUp delay={0.4} className='text-center mb-6'>
					<p className='text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed'>{APP_DESCRIPTION}</p>
				</FadeInUp>

				{/* Current Difficulty Display */}
				<CurrentDifficulty
					className='text-center mb-6'
					topic={topic}
					difficulty={difficulty}
					onShowHistory={() => setShowHistory(true)}
				/>

				{/* Trivia Form */}
				<FadeInUp delay={0.6}>
					<TriviaForm
						topic={topic}
						difficulty={difficulty}
						questionCount={questionCount}
						loading={gameState.loading || isValidating}
						onTopicChange={setTopic}
						onDifficultyChange={setDifficulty}
						onQuestionCountChange={setQuestionCount}
						onSubmit={handleSubmit}
						onGameModeSelect={handleGameModeSelect}
						showGameModeSelector={showGameModeSelector}
						onGameModeSelectorClose={() => setShowGameModeSelector(false)}
					/>
				</FadeInUp>

				{/* Popular Topics Suggestions */}
				{!topic && (
					<FadeInUp delay={0.7} className='mt-4'>
						<div className='space-y-3'>
							<h3 className='text-sm font-medium text-white/80 text-center'>Popular Topics</h3>
							<div className='flex flex-wrap justify-center gap-2'>
								{POPULAR_TOPICS.slice(0, 8).map((suggestedTopic, index) => (
									<HoverScale key={suggestedTopic} delay={index * 0.05}>
										<button
											type='button'
											onClick={() => {
												setTopic(suggestedTopic);
												audioService.play(AudioKey.BUTTON_CLICK);
											}}
											className='px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white/90 hover:text-white transition-all duration-200 backdrop-blur-sm'
										>
											{suggestedTopic}
										</button>
									</HoverScale>
								))}
							</div>
						</div>
					</FadeInUp>
				)}

				{/* Favorite Topics */}
				<FadeInUp delay={0.8}>
					<FavoriteTopics favorites={gameState.favorites} onRemove={removeFavorite} onSelect={selectFavorite} />
				</FadeInUp>

				{/* Error Display */}
				<ErrorBanner message={gameState.error || ''} difficulty={difficulty} />

				{/* Game Mode Button */}
				{!gameState.loading && !gameState.trivia && (
					<FadeInUp delay={1} className='mt-6'>
						<HoverScale>
							<Button
								variant='primary'
								size='lg'
								className='w-full py-4 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transform hover:scale-105 transition-all duration-200'
								onClick={() => {
									audioService.play(AudioKey.BUTTON_CLICK);
									startNewGame();
								}}
							>
								<Icon name='gamepad' size='lg' className='mr-2' />
								Start Game with Options
							</Button>
						</HoverScale>
					</FadeInUp>
				)}

				{/* Active Game */}
				{gameState.trivia && (
					<ScaleIn className='mt-6' delay={0.5}>
						<Game
							trivia={gameState.trivia}
							selected={gameState.selected}
							score={gameState.score}
							onAnswer={handleAnswer}
							onNewQuestion={loadNextQuestion}
							gameMode={gameState.gameMode}
							onGameEnd={handleGameEnd}
						/>
					</ScaleIn>
				)}
			</ScaleIn>

			{/* Scoring and Leaderboard Section */}
			<StaggerContainer className='w-full max-w-4xl mt-8 space-y-6' delay={1.2}>
				{/* Score Change Indicator */}
				{scoreChange.hasChanged && (
					<FadeInUp delay={0.1}>
						<div className='text-center'>
							<div
								className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
									scoreChange.current > (scoreChange.previous || 0)
										? 'bg-green-500/20 text-green-300 border border-green-400/30'
										: 'bg-red-500/20 text-red-300 border border-red-400/30'
								}`}
							>
								<Icon
									name={scoreChange.current > (scoreChange.previous || 0) ? 'trending-up' : 'trending-down'}
									size='sm'
									className='mr-2'
								/>
								Score {scoreChange.current > (scoreChange.previous || 0) ? 'increased' : 'decreased'} by{' '}
								{Math.abs(scoreChange.current - (scoreChange.previous || 0))}
							</div>
						</div>
					</FadeInUp>
				)}

				<div className='flex flex-col lg:flex-row lg:items-start lg:space-x-6 space-y-6 lg:space-y-0'>
					<motion.div className='flex-1'>
						<ScoringSystem
							stats={gameState.stats}
							score={gameState.score}
							total={gameState.total}
							topicsPlayed={Object.keys(gameState.stats.topicsPlayed)}
							difficultyStats={gameState.stats.successRateByDifficulty}
							currentQuestionMetadata={gameState.trivia?.metadata}
						/>
					</motion.div>

					{/* Social Share Component */}
					{gameState.total > 0 && (
						<FadeInRight delay={1.4} className='lg:w-auto w-full'>
							<SocialShare
								score={gameState.score}
								total={gameState.total}
								topic={topic}
								difficulty={difficulty}
								className='w-full lg:w-auto'
							/>
						</FadeInRight>
					)}
				</div>

				<Leaderboard userId={userId} />
			</StaggerContainer>

			{/* Modals */}
			<CustomDifficultyHistory
				isVisible={showHistory}
				onSelect={selectFromHistory}
				onClose={() => setShowHistory(false)}
			/>
			<GameModeComponent
				isVisible={showGameModeSelector}
				onSelectMode={handleGameModeSelect}
				onModeSelect={(mode: string) => loggerService.game('Game mode selected', { mode })}
				onCancel={() => setShowGameModeSelector(false)}
			/>
		</div>
	);
}
