import { useEffect, useMemo, useState } from 'react';

import { motion } from 'framer-motion';

import { DifficultyLevel, VALID_GAME_MODES } from '@shared/constants';
import { clientLogger as logger } from '@shared/services';
import type { GameHistoryEntry } from '@shared/types';
import { calculatePercentage, unique } from '@shared/utils';

import {
	Button,
	Card,
	ConfirmModal,
	Container,
	createStaggerContainer,
	CustomDifficultyHistory,
	fadeInDown,
	fadeInLeft,
	fadeInUp,
	GridLayout,
} from '../../components';
import {
	AlertVariant,
	AudioKey,
	ButtonVariant,
	CardVariant,
	CLIENT_STORAGE_KEYS,
	ComponentSize,
	ContainerSize,
	Spacing,
} from '../../constants';
import { useClearGameHistory, useDeleteGameHistory, useGameHistory } from '../../hooks';
import { audioService, storageService } from '../../services';
import { formatScore, isToday, isYesterday } from '../../utils';

export default function GameHistory() {
	// Authentication is handled by ProtectedRoute HOC
	// const { isAuthenticated } = useSelector((state: RootState) => state.user);

	const [page] = useState(0);
	const [dateFilter, setDateFilter] = useState('');
	const [topicFilter, setTopicFilter] = useState('');
	const [difficultyFilter, setDifficultyFilter] = useState('');
	const [confirmModal, setConfirmModal] = useState<{
		open: boolean;
		title: string;
		message: string;
		onConfirm: () => void;
	}>({
		open: false,
		title: '',
		message: '',
		onConfirm: () => {},
	});
	const [topics, setTopics] = useState<string[]>([]);
	const [totalGames, setTotalGames] = useState(0);
	const [totalScore, setTotalScore] = useState(0);
	const [averageScore, setAverageScore] = useState(0);
	const [averageAccuracy, setAverageAccuracy] = useState(0);

	// Use custom hook for game history
	const { data: gameHistory = [], isLoading: loading, error, refetch } = useGameHistory(20, page * 20);

	// Game history management hooks
	const deleteGameHistory = useDeleteGameHistory();
	const clearGameHistory = useClearGameHistory();

	// Refetch when page changes
	useEffect(() => {
		// Always refetch since authentication is handled by ProtectedRoute
		refetch();
	}, [page, refetch]);

	// Memoize game statistics to avoid recalculation on every render
	const gameStatistics = useMemo(() => {
		if (!gameHistory || gameHistory.length === 0) {
			return {
				topics: [],
				totalGames: 0,
				totalScore: 0,
				averageScore: 0,
				averageAccuracy: 0,
			};
		}

		// Calculate unique topics
		const uniqueTopics = unique(gameHistory.map((game: GameHistoryEntry) => game.topic));

		// Calculate statistics
		const games = Array.isArray(gameHistory) ? gameHistory : [];
		const sumScore = games.reduce((sum: number, game: GameHistoryEntry) => sum + (game.score ?? 0), 0);
		const avgScore = games.length > 0 ? Math.round(sumScore / games.length) : 0;

		const totalCorrect = games.reduce((sum: number, game: GameHistoryEntry) => sum + (game.correctAnswers ?? 0), 0);
		const totalQuestions = games.reduce((sum: number, game: GameHistoryEntry) => sum + (game.totalQuestions ?? 0), 0);
		const avgAccuracy = calculatePercentage(totalCorrect, totalQuestions);

		return {
			topics: uniqueTopics,
			totalGames: games.length,
			totalScore: sumScore,
			averageScore: avgScore,
			averageAccuracy: avgAccuracy,
		};
	}, [gameHistory]);

	// Update state when statistics change
	useEffect(() => {
		setTopics(gameStatistics.topics);
		setTotalGames(gameStatistics.totalGames);
		setTotalScore(gameStatistics.totalScore);
		setAverageScore(gameStatistics.averageScore);
		setAverageAccuracy(gameStatistics.averageAccuracy);

		// Log and save statistics when they change
		if (gameStatistics.totalGames > 0) {
			logger.gameStatistics('Game history statistics calculated', {
				totalGames: gameStatistics.totalGames,
				totalScore: gameStatistics.totalScore,
				averageScore: gameStatistics.averageScore,
				averageAccuracy: gameStatistics.averageAccuracy,
				gameModes: VALID_GAME_MODES,
				timestamp: new Date().toISOString(),
			});

			// Save statistics to storage
			storageService.set(CLIENT_STORAGE_KEYS.GAME_HISTORY, {
				totalGames: gameStatistics.totalGames,
				totalScore: gameStatistics.totalScore,
				averageScore: gameStatistics.averageScore,
				averageAccuracy: gameStatistics.averageAccuracy,
				lastModified: new Date().toISOString(),
			});
		}
	}, [gameStatistics]);

	return (
		<main role='main' aria-label='Game History'>
			<Container size={ContainerSize.XL} className='min-h-screen flex flex-col items-center justify-start p-4 pt-12'>
				<Card variant={CardVariant.TRANSPARENT} padding={Spacing.XL} className='w-full space-y-8'>
					{/* Header */}
					<motion.header
						variants={fadeInDown}
						initial='hidden'
						animate='visible'
						transition={{ delay: 0.2 }}
						className='text-center mb-12'
					>
						<h1 className='text-4xl md:text-5xl font-bold text-white mb-4 gradient-text'>Game History</h1>
						<p className='text-xl text-slate-300'>Review your past trivia sessions</p>

						{/* Management Buttons */}
						{gameHistory.length > 0 && (
							<div className='flex justify-center gap-4 mt-6'>
								<Button
									variant={ButtonVariant.SECONDARY}
									onClick={() => {
										audioService.play(AudioKey.BUTTON_CLICK);
										setConfirmModal({
											open: true,
											title: 'Clear All History',
											message: 'Are you sure you want to clear all game history? This action cannot be undone.',
											onConfirm: () => {
												clearGameHistory.mutate();
												setConfirmModal(prev => ({ ...prev, open: false }));
											},
										});
									}}
									disabled={clearGameHistory.isPending}
									className='bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-400/30'
								>
									{clearGameHistory.isPending ? 'Clearing...' : 'Clear All History'}
								</Button>
							</div>
						)}
					</motion.header>

					{/* Filters */}
					<motion.section
						variants={fadeInUp}
						initial='hidden'
						animate='visible'
						transition={{ delay: 0.4 }}
						whileHover={{ scale: 1.02 }}
						aria-label='Game History Filters'
					>
						<Card variant={CardVariant.GLASS} padding={Spacing.LG} className='rounded-lg'>
							<GridLayout variant='balanced' gap={Spacing.MD}>
								<div>
									<label className='block text-white font-medium mb-2'>Date Range</label>
									<select
										value={dateFilter}
										onChange={e => {
											audioService.play(AudioKey.BUTTON_CLICK);
											setDateFilter(e.target.value);
										}}
										className='w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
									>
										<option value='all'>All Time</option>
										<option value='today'>Today</option>
										<option value='week'>This Week</option>
										<option value='month'>This Month</option>
									</select>
								</div>
								<div>
									<label className='block text-white font-medium mb-2'>Topic</label>
									<select
										value={topicFilter}
										onChange={e => {
											audioService.play(AudioKey.BUTTON_CLICK);
											setTopicFilter(e.target.value);
										}}
										className='w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
									>
										<option value='all'>All Topics</option>
										{topics.map(topic => (
											<option key={topic} value={topic}>
												{topic}
											</option>
										))}
									</select>
								</div>
								<div>
									<label className='block text-white font-medium mb-2'>Difficulty</label>
									<select
										value={difficultyFilter}
										onChange={e => {
											audioService.play(AudioKey.BUTTON_CLICK);
											setDifficultyFilter(e.target.value);
										}}
										className='w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
									>
										<option value='all'>All Difficulties</option>
										<option value={DifficultyLevel.EASY}>Easy</option>
										<option value={DifficultyLevel.MEDIUM}>Medium</option>
										<option value={DifficultyLevel.HARD}>Hard</option>
										<option value={DifficultyLevel.CUSTOM}>Custom</option>
									</select>
								</div>
							</GridLayout>
						</Card>
					</motion.section>

					{/* Game History List */}
					<motion.section
						variants={fadeInUp}
						initial='hidden'
						animate='visible'
						transition={{ delay: 0.6 }}
						whileHover={{ scale: 1.02 }}
						aria-label='Game History List'
					>
						<Card variant={CardVariant.GLASS} padding={Spacing.LG} className='rounded-lg'>
							<h2 className='text-2xl font-bold text-white mb-6'>Game History</h2>
							{loading ? (
								<div className='text-center py-8'>
									<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto'></div>
									<p className='text-slate-300 mt-2'>Loading game history...</p>
								</div>
							) : error ? (
								<div className='text-center py-8'>
									<p className='text-red-400'>{error?.message || 'An error occurred'}</p>
								</div>
							) : gameHistory.length === 0 ? (
								<div className='text-center py-8'>
									<p className='text-slate-300 text-lg'>No games played yet</p>
									<p className='text-slate-400'>Start playing trivia to see your history here!</p>
								</div>
							) : (
								<motion.div
									variants={createStaggerContainer(0.1)}
									initial='hidden'
									animate='visible'
									className='space-y-4'
									role='list'
								>
									{gameHistory.map((game: GameHistoryEntry, index: number) => (
										<motion.article
											key={game.id}
											variants={fadeInLeft}
											custom={index * 0.05}
											whileHover={{ scale: 1.02 }}
											className='glass rounded-lg p-6 hover:bg-white/5 transition-all duration-200'
											aria-label={`Game ${game.id} - ${game.topic}`}
										>
											<GridLayout variant='auto-fit' gap={Spacing.MD} align='center'>
												<div className='col-span-2'>
													<h3 className='text-lg font-semibold text-white mb-2'>{game.topic}</h3>
													<p className='text-slate-300 text-sm'>
														{isToday(new Date(game.createdAt))
															? 'Today'
															: isYesterday(new Date(game.createdAt))
																? 'Yesterday'
																: new Date(game.createdAt).toLocaleDateString()}{' '}
														at {new Date(game.createdAt).toLocaleTimeString()}
													</p>
												</div>
												<div className='text-center'>
													<div className='text-2xl font-bold text-green-400'>{formatScore(game.score)}</div>
													<div className='text-slate-300 text-sm'>Score</div>
												</div>
												<div className='text-center'>
													<div className='text-2xl font-bold text-blue-400'>{game.totalQuestions}</div>
													<div className='text-slate-300 text-sm'>Questions</div>
												</div>
												<div className='text-center'>
													<div className='text-2xl font-bold text-yellow-400'>
														{calculatePercentage(game.correctAnswers, game.totalQuestions)}%
													</div>
													<div className='text-slate-300 text-sm'>Accuracy</div>
												</div>
												<div className='text-center'>
													<span
														className={`px-3 py-1 rounded-full text-sm font-medium ${
															game.difficulty === DifficultyLevel.EASY
																? 'bg-green-500/20 text-green-300 border border-green-400/30'
																: game.difficulty === DifficultyLevel.MEDIUM
																	? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30'
																	: game.difficulty === DifficultyLevel.HARD
																		? 'bg-red-500/20 text-red-300 border border-red-400/30'
																		: 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
														}`}
													>
														{game.difficulty}
													</span>
												</div>
												<div className='text-center'>
													<Button
														variant={ButtonVariant.SECONDARY}
														size={ComponentSize.SM}
														onClick={() => {
															audioService.play(AudioKey.BUTTON_CLICK);
															setConfirmModal({
																open: true,
																title: 'Delete Game',
																message: 'Are you sure you want to delete this game? This action cannot be undone.',
																onConfirm: () => {
																	deleteGameHistory.mutate(game.id);
																	setConfirmModal(prev => ({ ...prev, open: false }));
																},
															});
														}}
														disabled={deleteGameHistory.isPending}
														className='bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-400/30'
													>
														{deleteGameHistory.isPending ? '...' : 'Delete'}
													</Button>
												</div>
											</GridLayout>
										</motion.article>
									))}
								</motion.div>
							)}
						</Card>
					</motion.section>

					{/* Statistics Summary */}
					{gameHistory.length > 0 && (
						<motion.section
							variants={fadeInUp}
							initial='hidden'
							animate='visible'
							transition={{ delay: 0.8 }}
							whileHover={{ scale: 1.02 }}
							aria-label='Game History Summary'
						>
							<Card variant={CardVariant.GLASS} padding={Spacing.LG} className='rounded-lg'>
								<h2 className='text-2xl font-bold text-white mb-6'>Summary</h2>
								<GridLayout variant='stats' gap={Spacing.LG}>
									<div className='text-center'>
										<div className='text-3xl font-bold text-white mb-2'>{totalGames}</div>
										<div className='text-slate-300'>Total Games</div>
									</div>
									<div className='text-center'>
										<div className='text-3xl font-bold text-green-400 mb-2'>{totalScore}</div>
										<div className='text-slate-300'>Total Score</div>
									</div>
									<div className='text-center'>
										<div className='text-3xl font-bold text-blue-400 mb-2'>{averageScore}</div>
										<div className='text-slate-300'>Average Score</div>
									</div>
									<div className='text-center'>
										<div className='text-3xl font-bold text-yellow-400 mb-2'>{averageAccuracy}%</div>
										<div className='text-slate-300'>Average Accuracy</div>
									</div>
								</GridLayout>
							</Card>
						</motion.section>
					)}

					{/* Custom Difficulty History */}
					<motion.section
						variants={fadeInUp}
						initial='hidden'
						animate='visible'
						transition={{ delay: 1.0 }}
						whileHover={{ scale: 1.02 }}
						aria-label='Custom Difficulty History'
					>
						<Card variant={CardVariant.GLASS} padding={Spacing.LG} className='rounded-lg'>
							<h2 className='text-2xl font-bold text-white mb-6'>Custom Difficulty History</h2>
							<CustomDifficultyHistory
								isVisible={true}
								onSelect={(topic, difficulty) => {
									audioService.play(AudioKey.BUTTON_CLICK);
									setTopicFilter(topic);
									setDifficultyFilter(difficulty);
								}}
								onClose={() => {
									audioService.play(AudioKey.BUTTON_CLICK);
								}}
							/>
						</Card>
					</motion.section>
				</Card>
			</Container>

			{/* Confirm Modal */}
			<ConfirmModal
				open={confirmModal.open}
				onClose={() => setConfirmModal(prev => ({ ...prev, open: false }))}
				onConfirm={confirmModal.onConfirm}
				title={confirmModal.title}
				message={confirmModal.message}
				confirmText='Confirm'
				cancelText='Cancel'
				variant={AlertVariant.ERROR}
			/>
		</main>
	);
}
