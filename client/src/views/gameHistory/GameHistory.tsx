import {
	DifficultyLevel,
	VALID_GAME_MODES,
} from 'everytriv-shared/constants';
import type { GameHistoryEntry } from 'everytriv-shared/types';
import { calculatePercentage,formatScore, isToday, isYesterday, unique } from 'everytriv-shared/utils';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { FadeInDown, FadeInLeft, FadeInUp, StaggerContainer } from '../../components/animations';
import { Container, GridLayout, Section } from '../../components/layout';
import { Button } from '../../components/ui';
import { AudioKey } from '../../constants';
import { useGameHistory } from '../../hooks';
import { audioService, logger, storageService } from '../../services';
import type { RootState } from '../../types';

export default function GameHistory() {
	const { isAuthenticated } = useSelector((state: RootState) => state.user);
	const [page] = useState(0);
	const [dateFilter, setDateFilter] = useState('');
	const [topicFilter, setTopicFilter] = useState('');
	const [difficultyFilter, setDifficultyFilter] = useState('');
	const [topics, setTopics] = useState<string[]>([]);
	const [totalGames, setTotalGames] = useState(0);
	const [totalScore, setTotalScore] = useState(0);
	const [averageScore, setAverageScore] = useState(0);
	const [averageAccuracy, setAverageAccuracy] = useState(0);

	// Use custom hook for game history
	const { data: gameHistory = [], isLoading: loading, error, refetch } = useGameHistory(20, page * 20);

	// Refetch when page changes
	useEffect(() => {
		if (isAuthenticated) {
			refetch();
		}
	}, [page, isAuthenticated, refetch]);

	// Calculate statistics when game history changes
	useEffect(() => {
		if (gameHistory && gameHistory.length > 0) {
					// Calculate unique topics
		const uniqueTopics = unique(gameHistory.map((game: GameHistoryEntry) => game.topic));
		setTopics(uniqueTopics);

		// Calculate statistics
		const games = Array.isArray(gameHistory) ? gameHistory : [];
		setTotalGames(games.length);

		const sumScore = games.reduce((sum: number, game: GameHistoryEntry) => sum + (game.score || 0), 0);
		setTotalScore(sumScore);

		const avgScore = games.length > 0 ? Math.round(sumScore / games.length) : 0;
		setAverageScore(avgScore);

		const totalCorrect = games.reduce((sum: number, game: GameHistoryEntry) => sum + (game.correct_answers || 0), 0);
		const totalQuestions = games.reduce((sum: number, game: GameHistoryEntry) => sum + (game.total_questions || 0), 0);
		const avgAccuracy = calculatePercentage(totalCorrect, totalQuestions);
		setAverageAccuracy(avgAccuracy);

			// Log statistics with constants
			logger.gameStatistics('Game history statistics calculated', {
				totalGames: games.length,
				totalScore: sumScore,
				averageScore: avgScore,
				averageAccuracy: avgAccuracy,
				gameModes: VALID_GAME_MODES,
				
				timestamp: new Date().toISOString(),
			});

			// Save statistics to storage
			storageService.setItem('game-history-stats', {
				totalGames: games.length,
				totalScore: sumScore,
				averageScore: avgScore,
				averageAccuracy: avgAccuracy,
				lastUpdated: new Date().toISOString(),
			});
		} else {
			setTopics([]);
			setTotalGames(0);
			setTotalScore(0);
			setAverageScore(0);
			setAverageAccuracy(0);
		}
	}, [gameHistory]);

	if (!isAuthenticated) {
		return (
			<div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-800 to-pink-700'>
				<div className='glass p-8 rounded-lg text-center'>
					<h2 className='text-2xl font-bold text-white mb-4'>Sign In Required</h2>
					<p className='text-slate-300 mb-6'>Please sign in to view your game history.</p>
					<Button variant='primary'>Sign In with Google</Button>
				</div>
			</div>
		);
	}

	return (
		<Container size='xl' className='min-h-screen flex flex-col items-center justify-start p-4 pt-20'>
			<Section padding='xl' className='w-full space-y-8'>
				{/* Header */}
				<FadeInDown className='text-center mb-12' delay={0.2}>
					<h1 className='text-4xl md:text-5xl font-bold text-white mb-4 gradient-text'>Game History</h1>
					<p className='text-xl text-slate-300'>Review your past trivia sessions</p>
				</FadeInDown>

				{/* Filters */}
				<FadeInUp delay={0.4}>
					<Section background='glass' padding='lg' className='rounded-lg'>
						<GridLayout variant='content' gap='lg' className='items-center'>
							<div>
								<label className='block text-white font-medium mb-2'>Date Range</label>
								<select
									value={dateFilter}
									onChange={(e) => {
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
									onChange={(e) => {
										audioService.play(AudioKey.BUTTON_CLICK);
										setTopicFilter(e.target.value);
									}}
									className='w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
								>
									<option value='all'>All Topics</option>
									{topics.map((topic) => (
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
									onChange={(e) => {
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
					</Section>
				</FadeInUp>

				{/* Game History List */}
				<FadeInUp delay={0.6}>
					<Section background='glass' padding='lg' className='rounded-lg'>
						<h2 className='text-2xl font-bold text-white mb-6'>Recent Games</h2>
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
							<StaggerContainer className='space-y-4'>
								{gameHistory.map((game: GameHistoryEntry, index: number) => (
									<FadeInLeft
										key={game.id}
										delay={index * 0.05}
										className='glass rounded-lg p-6 hover:bg-white/5 transition-all duration-200'
									>
										<GridLayout variant='content' gap='lg' className='items-center'>
											<div>
												<h3 className='text-lg font-semibold text-white mb-2'>{game.topic}</h3>
												<p className='text-slate-300 text-sm'>
													{isToday(new Date(game.created_at)) 
														? 'Today' 
														: isYesterday(new Date(game.created_at)) 
															? 'Yesterday' 
															: new Date(game.created_at).toLocaleDateString()} at{' '}
													{new Date(game.created_at).toLocaleTimeString()}
												</p>
											</div>
											<div className='text-center'>
												<div className='text-2xl font-bold text-green-400'>{formatScore(game.score)}</div>
												<div className='text-slate-300 text-sm'>Score</div>
											</div>
											<div className='text-center'>
												<div className='text-2xl font-bold text-blue-400'>{game.total_questions}</div>
												<div className='text-slate-300 text-sm'>Questions</div>
											</div>
											<div className='text-center'>
												<div className='text-2xl font-bold text-yellow-400'>
													{calculatePercentage(game.correct_answers, game.total_questions)}%
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
										</GridLayout>
									</FadeInLeft>
								))}
							</StaggerContainer>
						)}
					</Section>
				</FadeInUp>

				{/* Statistics Summary */}
				{gameHistory.length > 0 && (
					<FadeInUp delay={0.8}>
						<Section background='glass' padding='lg' className='rounded-lg'>
							<h2 className='text-2xl font-bold text-white mb-6'>Summary</h2>
							<GridLayout variant='stats' gap='lg'>
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
						</Section>
					</FadeInUp>
				)}
			</Section>
		</Container>
	);
}
