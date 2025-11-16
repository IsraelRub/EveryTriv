/**
 * Game Session View
 *
 * @module GameSessionView
 * @description Full game session with multiple questions and progress tracking
 */

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { motion } from 'framer-motion';

import { GAME_STATE_DEFAULTS } from '@shared/constants';
import { clientLogger as logger } from '@shared/services';
import type { QuestionData, TriviaQuestion } from '@shared/types';
import { getErrorMessage, isRecord } from '@shared/utils';

import { AlertModal, Card, ConfirmModal, Container, fadeInUp, Icon, TriviaGame } from '../../components';
import { AlertVariant, AudioKey, CardVariant, ComponentSize, ContainerSize } from '../../constants';
import { useAppSelector, useTriviaQuestionMutation } from '../../hooks';
import { selectCurrentDifficulty, selectCurrentTopic } from '../../redux/selectors';
import { audioService } from '../../services';
import type { RootState } from '../../types';

export default function GameSessionView() {
	const navigate = useNavigate();
	const { currentUser } = useSelector((state: RootState) => state.user);
	const currentTopic = useAppSelector(selectCurrentTopic);
	const currentDifficulty = useAppSelector(selectCurrentDifficulty);

	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [score, setScore] = useState(0);
	const [correctAnswers, setCorrectAnswers] = useState(0);
	const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
	const [loading, setLoading] = useState(true);
	const [gameStartTime] = useState(Date.now());
	const [questionsData, setQuestionsData] = useState<QuestionData[]>([]);
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
	const [confirmModal, setConfirmModal] = useState<{
		open: boolean;
		onConfirm: () => void;
	}>({
		open: false,
		onConfirm: () => {},
	});

	const totalQuestions = 10;
	const triviaMutation = useTriviaQuestionMutation();

	// Load initial questions
	useEffect(() => {
		const loadQuestions = async () => {
			try {
				setLoading(true);
				const response = await triviaMutation.mutateAsync({
					topic: currentTopic || GAME_STATE_DEFAULTS.TOPIC,
					difficulty: currentDifficulty || 'medium',
					questionCount: totalQuestions,
					userId: currentUser?.id || '',
				});

				if (response && Array.isArray(response)) {
					setQuestions(response);
				} else if (isRecord(response)) {
					// Handle single question response
					setQuestions([response]);
				}

				setLoading(false);
				audioService.play(AudioKey.GAME_START);
				audioService.play(AudioKey.GAME_MUSIC);
			} catch (error) {
				logger.gameError('Failed to load questions', { error: getErrorMessage(error) });
				audioService.play(AudioKey.ERROR);
				setAlertModal({
					open: true,
					title: 'Load Failed',
					message: 'Failed to load questions. Returning to home.',
					variant: AlertVariant.ERROR,
				});
				setTimeout(() => navigate('/'), 2000);
			}
		};

		loadQuestions();
	}, []);

	const handleQuestionComplete = (wasCorrect: boolean, pointsEarned: number = 0) => {
		if (wasCorrect) {
			setCorrectAnswers(prev => prev + 1);
			setScore(prev => prev + pointsEarned);
		}

		// Record question data
		const currentQ = questions[currentQuestionIndex];
		const questionTimeSpent = 30 - (30 - (Math.floor((Date.now() - gameStartTime) / 1000) % 30)); // Approximate time spent on this question

		setQuestionsData(prev => [
			...prev,
			{
				question: currentQ?.question || '',
				userAnswer: wasCorrect ? currentQ?.answers?.[currentQ?.correctAnswerIndex]?.text || '' : 'Incorrect',
				correctAnswer: currentQ?.answers?.[currentQ?.correctAnswerIndex]?.text || '',
				isCorrect: wasCorrect,
				timeSpent: questionTimeSpent,
			},
		]);

		// Check if game is complete
		if (currentQuestionIndex + 1 >= totalQuestions || currentQuestionIndex + 1 >= questions.length) {
			// Game over - navigate to summary
			audioService.stop(AudioKey.GAME_MUSIC);
			audioService.play(AudioKey.GAME_END);

			const totalTimeSpent = Math.floor((Date.now() - gameStartTime) / 1000);

			navigate('/game/summary', {
				state: {
					score: wasCorrect ? score + pointsEarned : score,
					totalQuestions,
					correctAnswers: wasCorrect ? correctAnswers + 1 : correctAnswers,
					topic: currentTopic,
					difficulty: currentDifficulty,
					timeSpent: totalTimeSpent,
					questionsData: [
						...questionsData,
						{
							question: currentQ?.question || '',
							userAnswer: wasCorrect ? currentQ?.answers?.[currentQ?.correctAnswerIndex]?.text || '' : 'Incorrect',
							correctAnswer: currentQ?.answers?.[currentQ?.correctAnswerIndex]?.text || '',
							isCorrect: wasCorrect,
							timeSpent: questionTimeSpent,
						},
					],
				},
			});
		} else {
			// Next question
			setCurrentQuestionIndex(prev => prev + 1);
		}
	};

	if (loading) {
		return (
			<main role='main' aria-label='Loading Game'>
				<Container size={ContainerSize.XL} className='min-h-screen flex items-center justify-center'>
					<div className='text-center'>
						<div className='animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4'></div>
						<p className='text-xl text-white'>Loading your trivia questions...</p>
					</div>
				</Container>
			</main>
		);
	}

	if (!questions || questions.length === 0) {
		return (
			<main role='main' aria-label='No Questions'>
				<Container size={ContainerSize.XL} className='min-h-screen flex items-center justify-center'>
					<div className='text-center'>
						<p className='text-xl text-white mb-4'>No questions available</p>
						<button
							onClick={() => navigate('/')}
							className='px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600'
						>
							Return Home
						</button>
					</div>
				</Container>
			</main>
		);
	}

	const currentQuestion = questions[currentQuestionIndex];
	const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

	return (
		<main role='main' aria-label='Game Session'>
			<Container size={ContainerSize.XL} className='min-h-screen py-8'>
				{/* Progress Bar */}
				<motion.div variants={fadeInUp} initial='hidden' animate='visible' className='mb-8'>
					<div className='flex justify-between items-center mb-2'>
						<span className='text-white font-medium'>
							Question {currentQuestionIndex + 1} of {totalQuestions}
						</span>
						<span className='text-blue-400 font-bold'>Score: {score}</span>
					</div>
					<div className='w-full bg-slate-800 rounded-full h-3 overflow-hidden'>
						<motion.div
							initial={{ width: 0 }}
							animate={{ width: `${progress}%` }}
							transition={{ duration: 0.3 }}
							className='h-full bg-gradient-to-r from-blue-500 to-purple-500'
						/>
					</div>
				</motion.div>

				{/* Game Info */}
				<motion.div
					variants={fadeInUp}
					initial='hidden'
					animate='visible'
					transition={{ delay: 0.1 }}
					className='mb-6 text-center'
				>
					<div className='flex items-center justify-center gap-2 text-sm text-slate-400'>
						<span>Topic: {currentTopic || 'General'}</span>
						<Icon name='dot' size={ComponentSize.XS} className='text-slate-500' />
						<span>Difficulty: {currentDifficulty || 'Medium'}</span>
					</div>
				</motion.div>

				{/* Trivia Game */}
				<Card variant={CardVariant.TRANSPARENT}>
					{currentQuestion && (
						<TriviaGame
							key={currentQuestionIndex}
							question={{
								id: currentQuestion.id,
								question: currentQuestion.question,
								answers: currentQuestion.answers,
								correctAnswerIndex: currentQuestion.correctAnswerIndex,
								difficulty: currentQuestion.difficulty,
								topic: currentQuestion.topic,
								createdAt: new Date(),
								updatedAt: new Date(),
							}}
							onComplete={handleQuestionComplete}
							timeLimit={30}
						/>
					)}
				</Card>

				{/* Exit Button */}
				<motion.div
					variants={fadeInUp}
					initial='hidden'
					animate='visible'
					transition={{ delay: 0.8 }}
					className='mt-8 text-center'
				>
					<button
						onClick={() => {
							setConfirmModal({
								open: true,
								onConfirm: () => {
									audioService.stop(AudioKey.GAME_MUSIC);
									navigate('/');
								},
							});
						}}
						className='text-slate-400 hover:text-white transition-colors'
					>
						Exit Game
					</button>
				</motion.div>
			</Container>

			{/* Alert Modal */}
			<AlertModal
				open={alertModal.open}
				onClose={() => setAlertModal(prev => ({ ...prev, open: false }))}
				title={alertModal.title}
				message={alertModal.message}
				variant={alertModal.variant}
			/>

			{/* Confirm Modal */}
			<ConfirmModal
				open={confirmModal.open}
				onClose={() => setConfirmModal({ open: false, onConfirm: () => {} })}
				onConfirm={confirmModal.onConfirm}
				title='Exit Game'
				message='Are you sure you want to quit? Your progress will be lost.'
				confirmText='Quit'
				cancelText='Continue'
				variant={AlertVariant.WARNING}
			/>
		</main>
	);
}
