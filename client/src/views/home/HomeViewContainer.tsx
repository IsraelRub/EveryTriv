import { useState, useCallback, FormEvent, createElement } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { HistoryIcon } from '../../shared/styles/icons';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import ScoringSystem from '../../shared/components/ScoringSystem';
import Leaderboard from '../../shared/components/Leaderboard';
import GameContainer from '../../shared/components/game/GameContainer';
import TriviaForm from '../../shared/components/TriviaForm';
import FavoriteTopics from '../../shared/components/FavoriteTopics';
import GameModeSelectionContainer from '../../shared/components/game-mode/GameModeSelectionContainer';
import CustomDifficultyHistory from '../../shared/components/CustomDifficultyHistory';
import { getOrCreateUserId } from '../../shared/utils/user.util';
import { apiService } from '../../shared/services/api.service';
import { GameState, QuestionCount } from '../../shared/types';
import { isCustomDifficulty, displayDifficulty, getDifficultyIcon } from '../../shared/utils/customDifficulty.utils';
import { AnimatedBackground } from '@/shared/components';
import { Button } from '@/shared/styles/ui';
import { useGameMusic } from '../../shared/audio';
import { useScoreAchievementSounds } from '../../shared/hooks/useScoreAchievementSounds';
import { useAdvancedScoreAnimations } from '../../shared/hooks/useAdvancedAnimations';
import { ConfettiEffect, PulseEffect, ShakeEffect, GlowEffect } from '@/shared/components/animations';
import { selectGameMode, startGame, endGame } from '@/redux/features/gameModeSlice';

const DEFAULT_FAVORITES = [
	{ topic: 'General Knowledge', difficulty: 'medium' },
	{ topic: 'Geography', difficulty: 'medium' },
	{ topic: 'History', difficulty: 'medium' },
	{ topic: 'Celebrities', difficulty: 'medium' },
];

// Remove gameMode from DEFAULT_GAME_STATE, as it's now managed by Redux
const DEFAULT_GAME_STATE: Omit<GameState, 'gameMode'> = {
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
	}
};

export default function HomeView() {
	const dispatch = useDispatch();
	const gameMode = useSelector(selectGameMode);
	
	const [topic, setTopic] = useState('');
	const [difficulty, setDifficulty] = useState('medium');
	const [questionCount, setQuestionCount] = useState<QuestionCount>(3);
	const [gameState, setGameState] = useState<Omit<GameState, 'gameMode'>>(DEFAULT_GAME_STATE);
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
				loading: false
			});
			
			// Start the game timer via Redux
			dispatch(startGame());
			
			// Set game active state to true when trivia is loaded
			setIsGameActive(true);
		} catch (err: unknown) {
			updateGameState({
				error: err instanceof Error ? err.message : 'An error occurred',
				loading: false,
			});
			setIsGameActive(false);
		}
	};

	const updateGameState = useCallback((updates: Partial<Omit<GameState, 'gameMode'>>) => {
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

			// For unlimited mode or if we're not in a game mode, set inactive after delay
			if (gameMode.mode === 'unlimited') {
				setTimeout(() => {
					setIsGameActive(false);
				}, 2000);
			}
		},
		[gameState, userId, updateStats, gameMode.mode]
	);

	// Handle game mode selection
	const handleGameModeSelect = (_: {
		mode: 'time-limited' | 'question-limited' | 'unlimited';
		timeLimit?: number;
		questionLimit?: number;
	}) => {
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
					loading: false
				});
				
				// Start the game timer via Redux
				dispatch(startGame());
				
				setIsGameActive(true);
				setShowGameModeSelector(false);
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
		// End the game via Redux
		dispatch(endGame());
		setIsGameActive(false);
	}, [dispatch]);
	
	// Start a new game with current settings
	const startNewGame = useCallback(() => {
		setShowGameModeSelector(true);
	}, []);
	
	// Load a new question during an active game
	const loadNextQuestion = useCallback(async () => {
		if (gameMode.isGameOver) return;
		
		updateGameState({ loading: true });
		try {
			const checkedTopic = await handleSpellCheck(topic);
			const response = await apiService.getTrivia({
				topic: checkedTopic,
				difficulty,
				userId,
			});
			
			// Update game state with new question
			updateGameState({ 
				trivia: response, 
				loading: false,
				selected: null
			});
		} catch (err: unknown) {
			updateGameState({
				error: err instanceof Error ? err.message : 'An error occurred',
				loading: false,
			});
		}
	}, [topic, difficulty, userId, gameMode.isGameOver, handleSpellCheck, updateGameState]);

	// פונקציה להצגת רמת הקושי הנוכחית בצורה ידידותית
	const getCurrentDifficultyDisplay = () => {
		return displayDifficulty(difficulty, 50);
	};

	return (
		<div className='min-h-screen flex flex-col items-center justify-center p-4 relative'>
			<AnimatedBackground>
				<></>
			</AnimatedBackground>
			<motion.div
				initial={{ x: 100, opacity: 0 }}
				animate={{ x: 0, opacity: 1 }}
				transition={{ duration: 0.8, ease: 'easeOut' }}
			>
				<Link
					to='/profile'
					className='fixed top-0 right-0 m-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full shadow-lg font-semibold transition-colors'
				>
					Profile
				</Link>
			</motion.div>
			<motion.div
				className='w-full max-w-4xl bg-white bg-opacity-10 rounded shadow p-4 glass-morphism'
				initial={{ y: 50, opacity: 0, scale: 0.9 }}
				animate={{ y: 0, opacity: 1, scale: 1 }}
				transition={{ duration: 1, ease: 'easeOut' }}
			>
				<motion.h1
					className='text-5xl font-bold text-center mb-4 text-white'
					initial={{ y: -30, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
				>
					EveryTriv
					<small className='block text-base mt-2 text-white opacity-75'>Smart Trivia Platform with Custom Difficulty Levels</small>
				</motion.h1>

				{/* הצגת רמת הקושי הנוכחית עם כפתור היסטוריה */}
				{difficulty && (
					<div className='text-center mb-3 flex items-center justify-center gap-2'>
						<span className='bg-blue-500 text-white text-base px-3 py-2 rounded-lg'>
							<span className='mr-1'>
								{createElement(getDifficultyIcon(difficulty))}
							</span>
							Current: {topic || 'No topic'} - {getCurrentDifficultyDisplay()}
						</span>
						{isCustomDifficulty(difficulty) && (
							<button
								className='border border-white text-white hover:bg-white hover:text-gray-900 text-sm px-3 py-1 rounded transition-colors'
								onClick={() => setShowHistory(true)}
								title='View custom difficulty history'
							>
								<HistoryIcon size={14} className="mr-1" /> History
							</button>
						)}
					</div>
				)}

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

				<FavoriteTopics favorites={gameState.favorites} onRemove={removeFavorite} onSelect={selectFavorite} />

				{gameState.error && (
					<motion.div
						className='bg-red-500 bg-opacity-20 border border-red-500 text-red-100 px-4 py-3 rounded mt-4'
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5 }}
					>
						<strong>Error:</strong> {gameState.error}
						{isCustomDifficulty(difficulty) && (
							<div className='mt-2'>
								<small>
									💡 Make sure your custom difficulty description is clear and specific. Examples: "university level
									physics", "beginner cooking skills", "professional sports knowledge"
								</small>
							</div>
						)}
					</motion.div>
				)}

				{/* Game Mode Button */}
				{!gameState.loading && !gameState.trivia && (
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.5 }}
						className="mt-4 mb-2"
					>
						<Button 
							variant="primary" 
							size="lg"
							className="w-full"
							onClick={startNewGame}
						>
							🎮 Start Game with Options
						</Button>
					</motion.div>
				)}
				
				{gameState.trivia && (
					<GameContainer 
						trivia={gameState.trivia}
						selected={gameState.selected}
						onAnswer={handleAnswer}
						onNewQuestion={loadNextQuestion}
						onGameEnd={handleGameEnd}
					/>
				)}

				<motion.div animate={controls}>
					<ScoringSystem
						score={gameState.score}
						total={gameState.total}
						topicsPlayed={gameState.stats.topicsPlayed}
						difficultyStats={gameState.stats.successRateByDifficulty}
					/>
				</motion.div>
				<Leaderboard userId={userId} />

				{/* רכיב היסטוריה לרמות קושי מותאמות */}
				<CustomDifficultyHistory
					isVisible={showHistory}
					onSelect={selectFromHistory}
					onClose={() => setShowHistory(false)}
				/>
				
				{/* Game Mode Selection UI */}
				{showGameModeSelector && (
					<GameModeSelectionContainer
						onSelect={handleGameModeSelect}
					/>
				)}
				
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
			</motion.div>
		</div>
	);
}
