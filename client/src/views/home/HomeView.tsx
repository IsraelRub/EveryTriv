import { useState, useCallback, FormEvent, createElement, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { HistoryIcon } from '../../shared/components/icons';
import { motion } from 'framer-motion';
import ScoringSystem from '../../shared/components/stats/ScoringSystem';
import Leaderboard from '../../shared/components/leaderboard/Leaderboard';
import Game from '../../shared/components/game/Game';
import TriviaForm from '../../shared/components/game/TriviaForm';
import FavoriteTopics from '../../shared/components/user/FavoriteTopics';
import GameModeComponent from '../../shared/components/game-mode/GameMode';
import CustomDifficultyHistory from '../../shared/components/stats/CustomDifficultyHistory';
import { SocialShare } from '../../shared/components/layout';
import { getOrCreateUserId } from '../../shared/utils/user.util';
import { apiService } from '../../shared/services/api.service';
import { GameState, QuestionCount, GameMode } from '../../shared/types';
import { isCustomDifficulty, displayDifficulty, getDifficultyIcon } from '../../shared/utils/customDifficulty.utils';
import { Button } from '../../shared/components/ui';
import { useGameMusic } from '../../shared/hooks';
import { useScoreAchievementSounds } from '../../shared/hooks/useScoreAchievementSounds';
import { useAdvancedScoreAnimations } from '../../shared/hooks/useAdvancedAnimations';
import { ConfettiEffect, PulseEffect, ShakeEffect, GlowEffect } from '../../shared/components/animations';
import { selectGameMode, endGame } from '../../redux/features/gameModeSlice';
import logger from '../../shared/services/logger.service';

const DEFAULT_FAVORITES = [
	{ topic: 'General Knowledge', difficulty: 'medium' },
	{ topic: 'Geography', difficulty: 'medium' },
	{ topic: 'History', difficulty: 'medium' },
	{ topic: 'Celebrities', difficulty: 'medium' },
];

const DEFAULT_GAME_STATE: GameState = {
	favorites: DEFAULT_FAVORITES,
	trivia: null,
	loading: false,
	error: '',
	score: 0,
	total: 0,
	selected: null,
	streak: 0,
	gameMode: {
		mode: GameMode.UNLIMITED,
		timeLimit: undefined,
		questionLimit: undefined,
		questionsRemaining: undefined,
		timeRemaining: undefined,
		isGameOver: false,
		timer: {
			isRunning: false,
			startTime: null,
			timeElapsed: 0
		}
	},
	stats: {
		topicsPlayed: {},
		successRateByDifficulty: {},
	},
};

export default function HomeView() {
	const dispatch = useDispatch();
	const gameMode = useSelector(selectGameMode);
	
	const [topic, setTopic] = useState('');
	const [difficulty, setDifficulty] = useState('medium');
	const [questionCount, setQuestionCount] = useState<QuestionCount>(3);
	const [gameState, setGameState] = useState<GameState>(DEFAULT_GAME_STATE);
	const [userId] = useState(() => getOrCreateUserId());
	const [showHistory, setShowHistory] = useState(false);
	const [isGameActive, setIsGameActive] = useState(false);
	const [showGameModeSelector, setShowGameModeSelector] = useState(false);
	
	// Use game music when trivia is active, otherwise use background music
	useGameMusic(isGameActive);
	
	// Use achievement sounds when score changes
	useScoreAchievementSounds(gameState.score, gameState.total);
	
	// Use advanced score animations for all effects
	const { effects, controls } = useAdvancedScoreAnimations(gameState.score, gameState.total);

	// Sync Redux gameMode with local state
	useEffect(() => {
		setGameState(prev => ({
			...prev,
			gameMode: gameMode
		}));
	}, [gameMode]);

	// Log component mounting
	useEffect(() => {
		return () => {
		};
	}, []);

	const handleSpellCheck = async (text: string) => {
		// TODO: Integrate with external spell-check API
		return text;
	};

	const updateGameState = useCallback((updates: Partial<GameState>) => {
		setGameState((prev) => ({ ...prev, ...updates }));
	}, []);

	const addFavorite = useCallback(() => {
		if (!topic || gameState.favorites.some((f) => f.topic === topic && f.difficulty === difficulty)) return;
		updateGameState({
			favorites: [...gameState.favorites, { topic, difficulty }],
		});
	}, [topic, difficulty, gameState.favorites, updateGameState]);

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
		setDifficulty(favorite.difficulty);
	}, []);

	// פונקציה חדשה לטיפול בבחירה מההיסטוריה
	const selectFromHistory = useCallback((historyTopic: string, historyDifficulty: string) => {
		setTopic(historyTopic);
		setDifficulty(historyDifficulty);
	}, []);

	const updateStats = useCallback(
		(topic: string, difficulty: string, isCorrect: boolean) => {
			const { stats } = gameState;
			// עבור רמת קושי מותאמת, נשתמש ב"custom" לסטטיסטיקות
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
			updateGameState({
				selected: i,
				total: gameState.total + 1,
				score: gameState.score + (isCorrect ? 1 : 0),
				stats: {
					...gameState.stats,
					...newStats,
				}
			});
			await apiService.saveHistory({
				...gameState.trivia,
				userId,
				isCorrect,
			});
			// For game modes that continue automatically, don't set inactive
			if (gameState.gameMode.mode === GameMode.TIME_LIMITED || gameState.gameMode.mode === GameMode.QUESTION_LIMITED) {
				// Game continues automatically - handled by Game component
			} else {
				// For unlimited mode or if we're not in a game mode, set inactive after delay
				setTimeout(() => {
					setIsGameActive(false);
				}, 2000);
			}
		},
		[gameState, userId, updateStats, updateGameState]
	);

	// Handle game mode selection
	const handleGameModeSelect = (config: {
		mode: GameMode;
		timeLimit?: number;
		questionLimit?: number;
	}) => {
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
					timeElapsed: 0
				}
			}
		});
		// Start the game after mode selection
		setShowGameModeSelector(false);
		// Start fetching the first question
		handleSubmitWithMode();
	};

	const handleSubmitWithMode = async () => {
		updateGameState({ error: '', loading: true });
		try {
			const checkedTopic = await handleSpellCheck(topic);

			if (isCustomDifficulty(difficulty)) {
				apiService.saveCustomDifficulty(checkedTopic, difficulty);
			}

			const response = await apiService.getTrivia({
				topic: checkedTopic,
				difficulty,
				questionCount,
				userId,
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
					}
				}
			});
			// Set game active state to true when trivia is loaded
			setIsGameActive(true);
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : 'An error occurred';
			updateGameState({
				error: errorMessage,
				loading: false,
			});
			setIsGameActive(false);
		}
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		
		logger.user(`📝 Trivia form submitted`, {
			topic: topic.substring(0, 50) + (topic.length > 50 ? '...' : ''),
			difficulty,
			questionCount,
			isGameActive,
			formValid: topic.trim().length > 0,
			timestamp: new Date().toISOString()
		});
		
		// Show game mode selection if not already active
		if (!isGameActive) {
			logger.user(`🎮 Game mode selector opened`, {
				reason: 'new_game_start'
			});
			setShowGameModeSelector(true);
			return;
		}
		
		await handleSubmitWithMode();
	};

	const handleGameEnd = useCallback(() => {
		updateGameState({
			gameMode: {
				...gameState.gameMode,
				isGameOver: true,
				timer: {
					...gameState.gameMode.timer,
					isRunning: false
				}
			}
		});
		setIsGameActive(false);
		dispatch(endGame());
	}, [gameState.gameMode, updateGameState, dispatch]);

	// Start a new game with current settings
	const startNewGame = useCallback(() => {
		setShowGameModeSelector(true);
	}, []);

	// Load a new question during an active game
	const loadNextQuestion = useCallback(async () => {
		if (gameState.gameMode.isGameOver) return;
		updateGameState({ loading: true });
		try {
			const checkedTopic = await handleSpellCheck(topic);
			const response = await apiService.getTrivia({
				topic: checkedTopic,
				difficulty,
				questionCount,
				userId,
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
				}
			});
		} catch (err: unknown) {
			updateGameState({
				error: err instanceof Error ? err.message : 'An error occurred',
				loading: false,
			});
		}
	}, [topic, difficulty, userId, gameState.gameMode, updateGameState, handleSpellCheck]);

	// פונקציה להצגת רמת הקושי הנוכחית בצורה ידידותית
	const getCurrentDifficultyDisplay = () => {
		return displayDifficulty(difficulty, 50);
	};

	return (
		<div className='min-h-screen flex flex-col items-center justify-center p-4 pt-20'>
			{/* Main Content Container */}
			<motion.div
				className='w-full max-w-4xl glass-morphism rounded-lg p-6 mx-auto'
				initial={{ y: 50, opacity: 0, scale: 0.9 }}
				animate={{ y: 0, opacity: 1, scale: 1 }}
				transition={{ duration: 0.8, ease: 'easeOut' }}
			>
				{/* Title Section */}
				<motion.div
					className='text-center mb-8'
					initial={{ y: -30, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
				>
					<h1 className='text-4xl md:text-5xl font-bold text-white mb-3 gradient-text'>
						EveryTriv
					</h1>
					<small className='block text-base mt-2 text-white opacity-75'>
						Smart Trivia Platform with Custom Difficulty Levels
					</small>
				</motion.div>

				{/* Current Difficulty Display */}
				{difficulty && (
					<motion.div 
						className='text-center mb-6 flex items-center justify-center gap-3'
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ delay: 0.4 }}
					>
						<div className='bg-blue-500/20 backdrop-blur-sm border border-blue-300/30 text-white text-base px-4 py-2 rounded-lg flex items-center gap-2'>
							<span className='text-lg'>
								{createElement(getDifficultyIcon(difficulty))}
							</span>
							<span>
								<strong>{topic || 'No topic'}</strong> - {getCurrentDifficultyDisplay()}
							</span>
						</div>
						{isCustomDifficulty(difficulty) && (
							<Button
								size="sm"
								variant="ghost"
								onClick={() => setShowHistory(true)}
								className="text-white/70 hover:text-white border border-white/20 hover:border-white/40"
							>
								<HistoryIcon size={14} className="mr-1" /> History
							</Button>
						)}
					</motion.div>
				)}

				{/* Trivia Form */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.6 }}
				>
					<TriviaForm
						topic={topic}
						difficulty={difficulty}
						questionCount={questionCount}
						loading={gameState.loading}
						onTopicChange={setTopic}
						onDifficultyChange={setDifficulty}
						onQuestionCountChange={setQuestionCount}
						onSubmit={handleSubmit}
						onAddFavorite={addFavorite}
						onGameModeSelect={handleGameModeSelect}
						showGameModeSelector={showGameModeSelector}
						onGameModeSelectorClose={() => setShowGameModeSelector(false)}
					/>
				</motion.div>

				{/* Favorite Topics */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.8 }}
				>
					<FavoriteTopics 
						favorites={gameState.favorites} 
						onRemove={removeFavorite} 
						onSelect={selectFavorite} 
					/>
				</motion.div>

				{/* Error Display */}
				{gameState.error && (
					<motion.div
						className='bg-red-500 bg-opacity-20 border border-red-500 text-red-100 px-4 py-3 rounded mt-4'
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5 }}
					>
						<strong>Error:</strong> {gameState.error}
						{isCustomDifficulty(difficulty) && (
							<div className='mt-2 text-sm text-red-300'>
								💡 Make sure your custom difficulty description is clear and specific. Examples: "university level
								physics", "beginner cooking skills", "professional sports knowledge"
							</div>
						)}
					</motion.div>
				)}

				{/* Game Mode Button */}
				{!gameState.loading && !gameState.trivia && (
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 1 }}
						className="mt-6"
					>
						<Button 
							variant="primary" 
							size="lg"
							className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transform hover:scale-105 transition-all duration-200"
							onClick={startNewGame}
						>
							🎮 Start Game with Options
						</Button>
					</motion.div>
				)}

				{/* Active Game */}
				{gameState.trivia && (
					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.5 }}
						className="mt-6"
					>
						<Game 
							trivia={gameState.trivia}
							selected={gameState.selected}
							onAnswer={handleAnswer}
							onNewQuestion={loadNextQuestion}
							gameMode={gameState.gameMode}
							onGameEnd={handleGameEnd}
						/>
					</motion.div>
				)}
			</motion.div>

			{/* Scoring and Leaderboard Section */}
			<motion.div
				className='w-full max-w-4xl mt-8 space-y-6'
				initial={{ opacity: 0, y: 30 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 1.2 }}
			>
				<div className="flex flex-col lg:flex-row lg:items-start lg:space-x-6 space-y-6 lg:space-y-0">
					<motion.div animate={controls} className="flex-1">
						<ScoringSystem
							score={gameState.score}
							total={gameState.total}
							topicsPlayed={gameState.stats.topicsPlayed}
							difficultyStats={gameState.stats.successRateByDifficulty}
							currentQuestionMetadata={gameState.trivia?.metadata}
						/>
					</motion.div>
					
					{/* Social Share Component */}
					{gameState.total > 0 && (
						<motion.div 
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: 1.4 }}
							className="lg:w-auto w-full"
						>
							<SocialShare
								score={gameState.score}
								total={gameState.total}
								topic={topic}
								difficulty={difficulty}
								className="w-full lg:w-auto"
							/>
						</motion.div>
					)}
				</div>
				
				<Leaderboard userId={userId} />
			</motion.div>

			{/* Modals */}
			<CustomDifficultyHistory
				isVisible={showHistory}
				onSelect={selectFromHistory}
				onClose={() => setShowHistory(false)}
			/>
			<GameModeComponent
				isVisible={showGameModeSelector}
				onSelectMode={handleGameModeSelect}
				onCancel={() => setShowGameModeSelector(false)}
			/>
			
			{/* Advanced Animation Effects */}
			<ConfettiEffect isVisible={effects.confetti} />
			{effects.pulse && (
				<PulseEffect color="rgba(34, 197, 94, 0.3)">
					<div className="fixed top-4 right-4 z-50 pointer-events-none">
						<div className="text-green-400 font-bold text-lg">+{gameState.score > 0 ? 1 : 0}</div>
					</div>
				</PulseEffect>
			)}
			{effects.shake && (
				<ShakeEffect>
					<div className="fixed top-4 right-4 z-50 pointer-events-none">
						<div className="text-red-400 font-bold text-lg">✗</div>
					</div>
				</ShakeEffect>
			)}
			{effects.glow && (
				<GlowEffect>
					<div className="fixed inset-0 pointer-events-none z-40" />
				</GlowEffect>
			)}
		</div>
	);
}
