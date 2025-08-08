import { useState, useCallback, FormEvent, createElement, useEffect } from 'react';
import { HistoryIcon } from '../../shared/styles/icons';
import { motion } from 'framer-motion';
import ScoringSystem from '../../shared/components/ScoringSystem';
import Leaderboard from '../../shared/components/Leaderboard';
import Game from '../../shared/components/Game';
import TriviaForm from '../../shared/components/TriviaForm';

import FavoriteTopics from '../../shared/components/FavoriteTopics';
import GameModeUI from '../../shared/styles/ui/GameMode';
import CustomDifficultyHistory from '../../shared/components/CustomDifficultyHistory';
import { getOrCreateUserId } from '../../shared/utils/user.util';
import { apiService } from '../../shared/services/api.service';
import { GameState, QuestionCount } from '../../shared/types';
import { isCustomDifficulty, displayDifficulty, getDifficultyIcon } from '../../shared/utils/customDifficulty.utils';
import { Button } from '@/shared/styles/ui';
import { useGameMusic } from '../../shared/audio';
import { useScoreAchievementSounds } from '../../shared/hooks/useScoreAchievementSounds';
import { useAdvancedScoreAnimations } from '../../shared/hooks/useAdvancedAnimations';
import { ConfettiEffect, PulseEffect, ShakeEffect, GlowEffect } from '@/shared/components/animations';
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
	stats: {
		topicsPlayed: {},
		successRateByDifficulty: {},
	},
	gameMode: {
		mode: 'question-limited',
		questionLimit: 20,
		timeLimit: 60,
		isGameOver: false,
		timer: {
			isRunning: false,
			startTime: null,
			timeElapsed: 0,
		}
	},
};
export default function HomeView() {
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
	const { effects } = useAdvancedScoreAnimations(gameState.score, gameState.total);
	// Log component mounting
	useEffect(() => {
		return () => {
		};
	}, []);
	const handleSpellCheck = async (text: string) => {
		// TODO: Integrate with external spell-check API
		return text;
	};
	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		
		// Show game mode selection if not already active
		if (!isGameActive) {
			setShowGameModeSelector(true);
			return;
		}
		updateGameState({ error: '', loading: true });
		
		try {
			const checkedTopic = await handleSpellCheck(topic);
			// שמירת רמת קושי מותאמת להיסטוריה
			if (isCustomDifficulty(difficulty)) {
				apiService.saveCustomDifficulty(checkedTopic, difficulty);
			}
			const response = await apiService.getTrivia({
				topic: checkedTopic,
				difficulty,
				userId,
			});
			
			updateGameState({ 
				trivia: response, 
				loading: false,
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
			if (gameState.gameMode.mode === 'time-limited' || gameState.gameMode.mode === 'question-limited') {
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
	// This needs to be defined outside other functions to avoid circular dependencies
	const handleGameModeSelect = (config: {
		mode: 'time-limited' | 'question-limited' | 'unlimited';
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
		(async () => {
			updateGameState({ error: '', loading: true });
			try {
				const checkedTopic = await handleSpellCheck(topic);
				if (isCustomDifficulty(difficulty)) {
					apiService.saveCustomDifficulty(checkedTopic, difficulty);
				}
				const response = await apiService.getTrivia({
					topic: checkedTopic,
					difficulty,
					userId,
				});
				updateGameState({ 
					trivia: response, 
					loading: false,
					gameMode: {
						...gameState.gameMode,
						timer: {
							...gameState.gameMode.timer,
							isRunning: true,
							startTime: Date.now(),
						}
					}
				});
				setIsGameActive(true);
			} catch (err: unknown) {
				updateGameState({
					error: err instanceof Error ? err.message : 'An error occurred',
					loading: false,
				});
				setIsGameActive(false);
			}
		})();
	};
	// Handle game end
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
	}, [gameState.gameMode, updateGameState]);
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
						gameState.gameMode.mode === 'question-limited' && gameState.gameMode.questionsRemaining 
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
					<p className='text-lg text-white/70'>
						Smart Trivia Platform with Custom Difficulty Levels
					</p>
				</motion.div>

				{/* Current Difficulty Display */}
				{difficulty && (
					<motion.div 
						className='text-center mb-6'
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.4 }}
					>
						<div className='flex items-center justify-center gap-3 flex-wrap'>
							<span className='inline-flex items-center px-4 py-2 bg-blue-500/20 text-blue-200 rounded-full text-sm font-medium border border-blue-400/30'>
								<span className='mr-2'>
									{createElement(getDifficultyIcon(difficulty))}
								</span>
								Current: {topic || 'No topic'} - {getCurrentDifficultyDisplay()}
							</span>
							{isCustomDifficulty(difficulty) && (
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setShowHistory(true)}
									className="text-white/70 hover:text-white border border-white/20 hover:border-white/40"
								>
									<HistoryIcon size={14} className="mr-1" /> History
								</Button>
							)}
						</div>
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
						className='bg-red-500/20 border border-red-400/30 rounded-lg p-4 mt-6 text-red-200'
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5 }}
					>
						<div className='flex items-start'>
							<span className='text-red-400 mr-2'>⚠️</span>
							<div>
								<strong>Error:</strong> {gameState.error}
								{isCustomDifficulty(difficulty) && (
									<div className='mt-2 text-sm text-red-300'>
										💡 Make sure your custom difficulty description is clear and specific. Examples: "university level
										physics", "beginner cooking skills", "professional sports knowledge"
									</div>
								)}
							</div>
						</div>
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
				<ScoringSystem
					score={gameState.score}
					total={gameState.total}
					topicsPlayed={gameState.stats.topicsPlayed}
					difficultyStats={gameState.stats.successRateByDifficulty}
				/>
				<Leaderboard userId={userId} />
			</motion.div>

			{/* Modals */}
			<CustomDifficultyHistory
				isVisible={showHistory}
				onSelect={selectFromHistory}
				onClose={() => setShowHistory(false)}
			/>
			<GameModeUI
				isVisible={showGameModeSelector}
				onSelectMode={handleGameModeSelect}
				onCancel={() => setShowGameModeSelector(false)}
			/>
			
			{/* Advanced Animation Effects */}
			<ConfettiEffect isVisible={effects.confetti} />
			{effects.pulse && (
				<PulseEffect color="rgba(34, 197, 94, 0.3)">
					<div className="fixed top-4 left-4 z-50 pointer-events-none">
						<div className="text-green-400 font-bold text-lg">Great!</div>
					</div>
				</PulseEffect>
			)}
			{effects.shake && (
				<ShakeEffect>
					<div className="fixed top-4 left-4 z-50 pointer-events-none">
						<div className="text-red-400 font-bold text-lg">Try again!</div>
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
