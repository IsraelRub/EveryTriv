/**
 * Game Summary View
 *
 * @module GameSummaryView
 * @description Game completion summary with stats and sharing
 */

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { motion } from 'framer-motion';

import { DifficultyLevel, GameMode } from '@shared/constants';
import { clientLogger as logger } from '@shared/services';
import type { QuestionData } from '@shared/types';
import { getErrorMessage, isRecord } from '@shared/utils';

import { AlertModal, Button, Card, Container, fadeInUp, GridLayout, Icon, scaleIn } from '../../components';
import {
	AlertVariant,
	AudioKey,
	ButtonVariant,
	CardVariant,
	ComponentSize,
	ContainerSize,
	Spacing,
} from '../../constants';
import { useSaveHistory, useUpdateUserRanking } from '../../hooks';
import { audioService } from '../../services';
import type { RootState } from '../../types';

interface GameSummaryState {
	score: number;
	totalQuestions: number;
	correctAnswers: number;
	topic: string;
	difficulty: DifficultyLevel;
	timeSpent?: number;
	questionsData?: QuestionData[];
}

export default function GameSummaryView() {
	const navigate = useNavigate();
	const location = useLocation();
	const { currentUser } = useSelector((state: RootState) => state.user);
	const { mutate: saveHistory } = useSaveHistory();
	const { mutate: updateRanking } = useUpdateUserRanking();
	const [alertModal, setAlertModal] = useState<{
		open: boolean;
		title: string;
		message: string;
		variant: AlertVariant;
	}>({
		open: false,
		title: '',
		message: '',
		variant: AlertVariant.INFO,
	});

	const isGameSummaryState = (value: unknown): value is GameSummaryState => {
		if (!isRecord(value)) {
			return false;
		}

		return (
			typeof value.score === 'number' &&
			typeof value.totalQuestions === 'number' &&
			typeof value.correctAnswers === 'number' &&
			typeof value.topic === 'string' &&
			typeof value.difficulty === 'string'
		);
	};

	const summaryData = isGameSummaryState(location.state) ? location.state : undefined;

	useEffect(() => {
		if (!summaryData) {
			setAlertModal({
				open: true,
				title: 'No Game Data',
				message: 'No game data found. Redirecting to home.',
				variant: AlertVariant.ERROR,
			});
			setTimeout(() => navigate('/'), 2000);
			return;
		}

		// Play completion sound
		audioService.play(AudioKey.SUCCESS);

		// Save game history
		saveHistory(
			{
				userId: currentUser?.id || '',
				score: summaryData.score,
				totalQuestions: summaryData.totalQuestions,
				correctAnswers: summaryData.correctAnswers,
				topic: summaryData.topic,
				difficulty: summaryData.difficulty,
				gameMode: GameMode.QUESTION_LIMITED,
				timeSpent: summaryData.timeSpent ?? 0,
				creditsUsed: summaryData.totalQuestions,
				questionsData: summaryData.questionsData ?? [],
			},
			{
				onSuccess: () => {
					logger.gameInfo('Game history saved', { score: summaryData.score });

					// Automatically update user ranking after game
					updateRanking(undefined, {
						onSuccess: () => {
							logger.gameInfo('User ranking updated automatically');
						},
						onError: error => {
							logger.gameError('Failed to update ranking', { error: getErrorMessage(error) });
						},
					});
				},
				onError: error => {
					logger.gameError('Failed to save game history', { error: getErrorMessage(error) });
				},
			}
		);
	}, []);

	if (!summaryData) {
		return null;
	}

	const { score, totalQuestions, correctAnswers, topic, difficulty } = summaryData;
	const accuracy = Math.round((correctAnswers / totalQuestions) * 100);
	const isPerfect = correctAnswers === totalQuestions;
	const isGood = accuracy >= 70;

	const handlePlayAgain = () => {
		audioService.play(AudioKey.BUTTON_CLICK);
		navigate('/');
	};

	const handleViewHistory = () => {
		audioService.play(AudioKey.BUTTON_CLICK);
		navigate('/history');
	};

	const handleShare = () => {
		audioService.play(AudioKey.BUTTON_CLICK);
		const text = `I just scored ${score} score on EveryTriv! ${correctAnswers}/${totalQuestions} correct answers (${accuracy}% accuracy)`;

		if (navigator.share) {
			navigator
				.share({
					title: 'EveryTriv Score',
					text,
				})
				.catch(() => {
					// Fallback: copy to clipboard
					navigator.clipboard.writeText(text);
					setAlertModal({
						open: true,
						title: 'Copied!',
						message: 'Score copied to clipboard!',
						variant: AlertVariant.SUCCESS,
					});
				});
		} else {
			navigator.clipboard.writeText(text);
			setAlertModal({
				open: true,
				title: 'Copied!',
				message: 'Score copied to clipboard!',
				variant: AlertVariant.SUCCESS,
			});
		}
	};

	const headerIcon = isPerfect ? 'trophy' : isGood ? 'partypopper' : 'dumbbell';
	const headerIconClass = isPerfect ? 'text-yellow-400' : isGood ? 'text-purple-400' : 'text-emerald-400';

	return (
		<main role='main' aria-label='Game Summary'>
			<Container size={ContainerSize.XL} className='min-h-screen py-8'>
				{/* Header */}
				<motion.header variants={scaleIn} initial='hidden' animate='visible' className='text-center mb-12'>
					<div className='mb-4 flex justify-center'>
						<Icon name={headerIcon} size={ComponentSize.XXL} className={headerIconClass} />
					</div>

					<h1 className='text-5xl font-bold text-white mb-4 gradient-text'>
						{isPerfect ? 'Perfect Score!' : isGood ? 'Great Job!' : 'Good Try!'}
					</h1>
					<p className='text-xl text-slate-300'>
						{isPerfect ? "You're a trivia master!" : isGood ? 'Keep up the excellent work!' : 'Practice makes perfect!'}
					</p>
				</motion.header>

				{/* Score Display */}
				<motion.section
					variants={scaleIn}
					initial='hidden'
					animate='visible'
					transition={{ delay: 0.2 }}
					className='mb-12'
					aria-label='Score Display'
				>
					<Card variant={CardVariant.GLASS} padding={Spacing.XL} className='rounded-lg text-center'>
						<div className='text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-4'>
							{score}
						</div>
						<p className='text-2xl text-slate-300'>Total Score</p>
					</Card>
				</motion.section>

				{/* Stats Grid */}
				<motion.section
					variants={fadeInUp}
					initial='hidden'
					animate='visible'
					transition={{ delay: 0.4 }}
					aria-label='Game Statistics'
				>
					<GridLayout variant='balanced' gap={Spacing.MD} className='mb-8'>
						<Card variant={CardVariant.GLASS} padding={Spacing.LG} className='rounded-lg text-center'>
							<div className='text-4xl font-bold text-green-400 mb-2'>{correctAnswers}</div>
							<p className='text-slate-300'>Correct</p>
						</Card>

						<Card variant={CardVariant.GLASS} padding={Spacing.LG} className='rounded-lg text-center'>
							<div className='text-4xl font-bold text-red-400 mb-2'>{totalQuestions - correctAnswers}</div>
							<p className='text-slate-300'>Incorrect</p>
						</Card>

						<Card variant={CardVariant.GLASS} padding={Spacing.LG} className='rounded-lg text-center'>
							<div className='text-4xl font-bold text-blue-400 mb-2'>{accuracy}%</div>
							<p className='text-slate-300'>Accuracy</p>
						</Card>
					</GridLayout>
				</motion.section>

				{/* Game Info */}
				<motion.section
					variants={fadeInUp}
					initial='hidden'
					animate='visible'
					transition={{ delay: 0.6 }}
					aria-label='Game Info'
				>
					<Card variant={CardVariant.GLASS} padding={Spacing.LG} className='rounded-lg mb-8'>
						<GridLayout variant='balanced' gap={Spacing.MD} className='text-center'>
							<div>
								<p className='text-slate-400 text-sm mb-1'>Topic</p>
								<p className='text-white font-medium'>{topic || 'General'}</p>
							</div>
							<div>
								<p className='text-slate-400 text-sm mb-1'>Difficulty</p>
								<p className='text-white font-medium capitalize'>{difficulty || 'Medium'}</p>
							</div>
						</GridLayout>
					</Card>
				</motion.section>

				{/* Action Buttons */}
				<motion.div
					variants={fadeInUp}
					initial='hidden'
					animate='visible'
					transition={{ delay: 0.8 }}
					className='space-y-4'
				>
					<Button
						onClick={handlePlayAgain}
						variant={ButtonVariant.PRIMARY}
						className='w-full py-4 text-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
					>
						<Icon name='Play' className='w-5 h-5 mr-2' />
						Play Again
					</Button>

					<GridLayout variant='balanced' gap={Spacing.MD} className=''>
						<Button onClick={handleViewHistory} variant={ButtonVariant.SECONDARY} className='w-full py-3'>
							<Icon name='History' className='w-5 h-5 mr-2' />
							View History
						</Button>

						<Button onClick={handleShare} variant={ButtonVariant.SECONDARY} className='w-full py-3'>
							<Icon name='Share' className='w-5 h-5 mr-2' />
							Share Score
						</Button>
					</GridLayout>
				</motion.div>

				{/* Encouragement Message */}
				<motion.footer
					variants={fadeInUp}
					initial='hidden'
					animate='visible'
					transition={{ delay: 1 }}
					className='mt-8 text-center text-slate-400'
				>
					{isPerfect ? (
						<p className='flex items-center justify-center gap-2'>
							<Icon name='star' size={ComponentSize.MD} className='text-yellow-400' />
							<span>Outstanding performance! You answered all questions correctly!</span>
						</p>
					) : accuracy >= 80 ? (
						<p>You're doing amazing! Just a few more to master!</p>
					) : accuracy >= 60 ? (
						<p>Good progress! Keep practicing to improve your score!</p>
					) : (
						<p>Every game is a learning opportunity. Try again!</p>
					)}
				</motion.footer>
			</Container>

			{/* Alert Modal */}
			<AlertModal
				open={alertModal.open}
				onClose={() => setAlertModal((prev: typeof alertModal) => ({ ...prev, open: false }))}
				title={alertModal.title}
				message={alertModal.message}
				variant={alertModal.variant}
			/>
		</main>
	);
}
