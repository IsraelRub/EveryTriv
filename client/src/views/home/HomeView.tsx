import { useState, useCallback, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ScoringSystem from '../../shared/components/ScoringSystem';
import Leaderboard from '../../shared/components/Leaderboard';
import AnimatedBackground from '../../shared/components/AnimatedBackground';
import TriviaGame from '../../shared/components/TriviaGame';
import TriviaForm from '../../shared/components/TriviaForm';
import FavoriteTopics from '../../shared/components/FavoriteTopics';
import { getOrCreateUserId } from '../../shared/services/user.util';
import { GameState } from '../../shared/models/game.model';

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

	const handleSpellCheck = async (text: string) => {
		// TODO: Integrate with external spell-check API
		return text;
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		updateGameState({ error: '', loading: true });
		try {
			const checkedTopic = await handleSpellCheck(topic);
			const response = await axios.post('/trivia', {
				topic: checkedTopic,
				difficulty,
				userId,
			});
			updateGameState({ trivia: response.data, loading: false });
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

	const updateStats = useCallback(
		(topic: string, difficulty: string, isCorrect: boolean) => {
			const { stats } = gameState;

			return {
				topicsPlayed: {
					...stats.topicsPlayed,
					[topic]: (stats.topicsPlayed[topic] || 0) + 1,
				},
				successRateByDifficulty: {
					...stats.successRateByDifficulty,
					[difficulty]: {
						correct: (stats.successRateByDifficulty[difficulty]?.correct || 0) + (isCorrect ? 1 : 0),
						total: (stats.successRateByDifficulty[difficulty]?.total || 0) + 1,
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

			await axios.post('/trivia/history', {
				...gameState.trivia,
				userId,
				isCorrect,
			});
		},
		[gameState, userId, updateStats, updateGameState]
	);
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
				</motion.h1>
				<TriviaForm
					topic={topic}
					difficulty={difficulty}
					loading={gameState.loading}
					onTopicChange={setTopic}
					onDifficultyChange={setDifficulty}
					onSubmit={handleSubmit}
					onAddFavorite={addFavorite}
				/>

				<FavoriteTopics favorites={gameState.favorites} onRemove={removeFavorite} />

				{gameState.error && <div className='alert alert-danger mt-4'>{gameState.error}</div>}

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
			</motion.div>
		</div>
	);
}
