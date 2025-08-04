import React, { useState, useCallback, FormEvent } from 'react';
import { HistoryIcon } from '../../shared/components/icons';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import ScoringSystem from '../../shared/components/ScoringSystem';
import Leaderboard from '../../shared/components/Leaderboard';

import TriviaGame from '../../shared/components/TriviaGame';
import TriviaForm from '../../shared/components/TriviaForm';
import FavoriteTopics from '../../shared/components/FavoriteTopics';
import CustomDifficultyHistory from '../../shared/components/CustomDifficultyHistory';
import { getOrCreateUserId } from '../../shared/services/user.util';
import { apiService } from '../../shared/services/api.service';
import { GameState } from '../../shared/models/game.model';
import { isCustomDifficulty, displayDifficulty, getDifficultyIcon } from '../../shared/utils/customDifficulty.utils';
import { AnimatedBackground } from '@/shared/components';

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
	stats: {
		topicsPlayed: {},
		successRateByDifficulty: {},
	},
};

export default function HomeView() {
	const [topic, setTopic] = useState('');
	const [difficulty, setDifficulty] = useState('medium');
	const [gameState, setGameState] = useState<GameState>(DEFAULT_GAME_STATE);
	const [userId] = useState(() => getOrCreateUserId());
	const [showHistory, setShowHistory] = useState(false);

	const handleSpellCheck = async (text: string) => {
		// TODO: Integrate with external spell-check API
		return text;
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
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

			updateGameState({ trivia: response, loading: false });
		} catch (err: unknown) {
			updateGameState({
				error: err instanceof Error ? err.message : 'An error occurred',
				loading: false,
			});
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
				},
			});

			await apiService.saveHistory({
				...gameState.trivia,
				userId,
				isCorrect,
			});
		},
		[gameState, userId, updateStats, updateGameState]
	);

	// פונקציה להצגת רמת הקושי הנוכחית בצורה ידידותית
	const getCurrentDifficultyDisplay = () => {
		return displayDifficulty(difficulty, 50);
	};

	return (
		<div className='min-vh-100 d-flex flex-column align-items-center justify-content-center p-4 position-relative'>
			<AnimatedBackground />
			<motion.div
				initial={{ x: 100, opacity: 0 }}
				animate={{ x: 0, opacity: 1 }}
				transition={{ duration: 0.8, ease: 'easeOut' }}
			>
				<Link
					to='/profile'
					className='position-fixed top-0 end-0 m-4 btn btn-primary rounded-pill shadow-lg fw-semibold'
				>
					Profile
				</Link>
			</motion.div>
			<motion.div
				className='w-100 mw-xl bg-white bg-opacity-10 rounded shadow p-4 glass-morphism'
				initial={{ y: 50, opacity: 0, scale: 0.9 }}
				animate={{ y: 0, opacity: 1, scale: 1 }}
				transition={{ duration: 1, ease: 'easeOut' }}
			>
				<motion.h1
					className='display-4 fw-bold text-center mb-4 text-white'
					initial={{ y: -30, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
				>
					EveryTriv
					<small className='d-block fs-6 mt-2 text-white-50'>Smart Trivia Platform with Custom Difficulty Levels</small>
				</motion.h1>

				{/* הצגת רמת הקושי הנוכחית עם כפתור היסטוריה */}
				{difficulty && (
					<div className='text-center mb-3 d-flex align-items-center justify-content-center gap-2'>
						<span className='badge bg-info fs-6 px-3 py-2'>
							{React.createElement(getDifficultyIcon(difficulty), { className: 'me-1', size: 16 })}
							Current: {topic || 'No topic'} - {getCurrentDifficultyDisplay()}
						</span>
						{isCustomDifficulty(difficulty) && (
							<button
								className='btn btn-outline-light btn-sm'
								onClick={() => setShowHistory(true)}
								title='View custom difficulty history'
							>
								<HistoryIcon size={14} className="me-1" /> History
							</button>
						)}
					</div>
				)}

				<TriviaForm
					topic={topic}
					difficulty={difficulty}
					loading={gameState.loading}
					onTopicChange={setTopic}
					onDifficultyChange={setDifficulty}
					onSubmit={handleSubmit}
					onAddFavorite={addFavorite}
				/>

				<FavoriteTopics favorites={gameState.favorites} onRemove={removeFavorite} onSelect={selectFavorite} />

				{gameState.error && (
					<motion.div
						className='alert alert-danger mt-4'
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

				{gameState.trivia && (
					<TriviaGame trivia={gameState.trivia} selected={gameState.selected} onAnswer={handleAnswer} />
				)}

				<ScoringSystem
					score={gameState.score}
					total={gameState.total}
					topicsPlayed={gameState.stats.topicsPlayed}
					difficultyStats={gameState.stats.successRateByDifficulty}
				/>
				<Leaderboard userId={userId} />

				{/* רכיב היסטוריה לרמות קושי מותאמות */}
				<CustomDifficultyHistory
					isVisible={showHistory}
					onSelect={selectFromHistory}
					onClose={() => setShowHistory(false)}
				/>
			</motion.div>
		</div>
	);
}
