/**
 * Trivia Game Component
 *
 * @module TriviaGame
 * @description Main trivia game component with timer, questions, and scoring
 */

import { useEffect, useState } from 'react';

import { motion } from 'framer-motion';

import { clientLogger as logger } from '@shared/services';
import type { TriviaAnswer } from '@shared/types';

import { AudioKey, ButtonVariant, ComponentSize } from '../../constants';
import { useAppDispatch } from '../../hooks';
import { updateScore } from '../../redux/slices';
import { audioService } from '../../services';
import type { TriviaGameProps } from '../../types';
import { fadeInUp, scaleIn } from '../animations';
import { Icon } from '../IconLibrary';
import { Button } from '../ui';

export default function TriviaGame({ question, onComplete, timeLimit = 30 }: TriviaGameProps) {
	const dispatch = useAppDispatch();
	const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
	const [timer, setTimer] = useState(timeLimit);
	const [answered, setAnswered] = useState(false);

	// Timer countdown
	useEffect(() => {
		if (answered || timer <= 0) return;

		const interval = setInterval(() => {
			setTimer(prev => {
				if (prev <= 1) {
					// Time's up!
					handleTimeout();
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(interval);
	}, [answered, timer]);

	const handleTimeout = () => {
		if (answered) return;

		audioService.play(AudioKey.ERROR);
		logger.gameError('Question timeout', { questionId: question.id });
		setAnswered(true);

		setTimeout(() => {
			onComplete(false, 0);
		}, 1500);
	};

	const calculatePoints = (difficulty: string, remainingTime: number): number => {
		const basePoints =
			{
				easy: 10,
				medium: 20,
				hard: 30,
			}[difficulty.toLowerCase()] || 10;

		// Time bonus: up to 50% extra for fast answers
		const timeBonus = Math.floor(basePoints * (remainingTime / timeLimit) * 0.5);

		return basePoints + timeBonus;
	};

	const handleAnswerSelect = (answerIndex: number) => {
		if (answered) return;

		audioService.play(AudioKey.BUTTON_CLICK);
		setSelectedAnswer(answerIndex);
	};

	const handleSubmit = () => {
		if (answered || selectedAnswer === null) return;

		setAnswered(true);
		const isCorrect = selectedAnswer === question.correctAnswerIndex;

		if (isCorrect) {
			const points = calculatePoints(question.difficulty, timer);
			dispatch(
				updateScore({
					score: points,
					timeSpent: 30 - timer,
					isCorrect: true,
					responseTime: 30 - timer,
				})
			);
			audioService.play(AudioKey.SUCCESS);
			logger.gameInfo('Correct answer', {
				questionId: question.id,
				points,
				timeRemaining: timer,
			});
		} else {
			audioService.play(AudioKey.ERROR);
			logger.gameInfo('Incorrect answer', {
				questionId: question.id,
				selectedAnswer: selectedAnswer.toString(),
				correctAnswer: question.correctAnswerIndex,
			});
		}

		// Wait a moment to show feedback, then complete
		const points = isCorrect ? calculatePoints(question.difficulty, timer) : 0;

		setTimeout(() => {
			onComplete(isCorrect, points);
		}, 1500);
	};

	const getTimerColor = () => {
		if (timer > 20) return 'text-green-400';
		if (timer > 10) return 'text-yellow-400';
		return 'text-red-400';
	};

	const getAnswerStyle = (index: number) => {
		if (!answered) {
			return selectedAnswer === index
				? 'bg-blue-500/30 border-blue-500'
				: 'bg-slate-800/50 border-slate-700 hover:border-blue-400';
		}

		// Show correct/incorrect after answer
		if (index === question.correctAnswerIndex) {
			return 'bg-green-500/30 border-green-500';
		}
		if (index === selectedAnswer) {
			return 'bg-red-500/30 border-red-500';
		}
		return 'bg-slate-800/30 border-slate-700';
	};

	return (
		<div className='max-w-3xl mx-auto'>
			{/* Timer */}
			<motion.div variants={scaleIn} initial='hidden' animate='visible' className='text-center mb-6'>
				<div className={`text-6xl font-bold ${getTimerColor()} transition-colors`}>{timer}s</div>
				<p className='text-slate-400 text-sm mt-2'>Time Remaining</p>
			</motion.div>

			{/* Question */}
			<motion.div
				variants={fadeInUp}
				initial='hidden'
				animate='visible'
				transition={{ delay: 0.2 }}
				className='bg-slate-800/50 backdrop-blur-sm rounded-lg p-8 mb-6 border-2 border-slate-700'
			>
				<p className='text-2xl text-white font-medium text-center'>{question.question}</p>
			</motion.div>

			{/* Answers */}
			<div className='space-y-4 mb-6'>
				{question.answers.map((answer: TriviaAnswer, index: number) => (
					<motion.button
						key={index}
						variants={fadeInUp}
						initial='hidden'
						animate='visible'
						transition={{ delay: 0.3 + index * 0.1 }}
						onClick={() => handleAnswerSelect(index)}
						disabled={answered}
						className={`
              w-full p-6 rounded-lg border-2 transition-all
              ${getAnswerStyle(index)}
              ${!answered && 'cursor-pointer hover:scale-[1.02]'}
              ${answered && 'cursor-not-allowed'}
            `}
					>
						<div className='flex items-center'>
							<div className='w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center mr-4 flex-shrink-0'>
								<span className='text-white font-bold'>{String.fromCharCode(65 + index)}</span>
							</div>
							<span className='text-white text-left text-lg'>{answer.text}</span>
						</div>
					</motion.button>
				))}
			</div>

			{/* Submit Button */}
			<motion.div variants={fadeInUp} initial='hidden' animate='visible' transition={{ delay: 0.7 }}>
				<Button
					onClick={handleSubmit}
					disabled={selectedAnswer === null || answered}
					variant={ButtonVariant.PRIMARY}
					className='w-full py-4 text-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
				>
					{answered ? 'Processing...' : 'Submit Answer'}
				</Button>
			</motion.div>

			{/* Feedback Message */}
			{answered && (
				<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='mt-6 text-center'>
					{selectedAnswer === question.correctAnswerIndex ? (
						<div className='text-green-400 text-xl font-bold flex items-center justify-center gap-2'>
							<Icon name='check' size={ComponentSize.SM} className='text-green-400' />
							<span>Correct! +{calculatePoints(question.difficulty, timer)} points</span>
						</div>
					) : (
						<div className='text-red-400 text-xl font-bold flex items-center justify-center gap-2'>
							<Icon name='x' size={ComponentSize.SM} className='text-red-400' />
							<span>Incorrect! The correct answer was {String.fromCharCode(65 + question.correctAnswerIndex)}</span>
						</div>
					)}
				</motion.div>
			)}
		</div>
	);
}
