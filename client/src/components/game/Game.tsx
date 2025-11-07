import { motion } from 'framer-motion';

import { GameMode } from '@shared/constants';
import { clientLogger as logger } from '@shared/services';

import { ButtonVariant, ComponentSize, Spacing } from '../../constants';
import { useGameTimer } from '../../hooks';
import { GameProps } from '../../types';
import { formatTimeDisplay } from '../../utils';
import { useGame } from '../../views/home/HomeView';
import { fadeInDown, fadeInUp, scaleIn } from '../animations';
import { Icon } from '../IconLibrary';
import { ResponsiveGrid } from '../layout';
import { Button } from '../ui';
import GameTimer from './GameTimer';
import TriviaGame from './TriviaGame';

/**
 * Main game component with timer, scoring, and game mode management
 *
 * @component Game
 * @description Comprehensive game component that manages game state, timer, scoring, and game flow
 * @param trivia - Current trivia question data
 * @param selected - Currently selected answer index
 * @param score - Current game score
 * @param onNewQuestion - New question generation handler
 * @param gameMode - Current game mode configuration
 * @param onGameEnd - Game end handler
 * @returns JSX.Element The rendered game interface with all game elements
 */
export default function Game({
	trivia,
	selected,
	onNewQuestion,
	gameMode,
	state,
	onStateChange,
	onGameEnd,
}: GameProps) {
	const { loadNextQuestion: contextLoadNextQuestion } = useGame();
	const currentGameMode = gameMode ?? state?.gameMode;

	// Use centralized game timer hook for timer management, game over detection, and time warnings

	useGameTimer(currentGameMode, onStateChange, state, onGameEnd);

	const renderGameStatus = () => {
		if (currentGameMode?.isGameOver) {
			const timeElapsed = currentGameMode.timer?.timeElapsed ?? 0;
			return (
				<motion.div
					variants={scaleIn}
					initial='hidden'
					animate='visible'
					className='game-over p-6 glass rounded-lg text-center mb-6'
					whileHover={{ scale: 1.02 }}
				>
					<div className='text-4xl mb-4'>🎉</div>
					<h2 className='text-2xl font-bold text-white mb-4'>Game Complete!</h2>
					<p className='text-lg text-white/80 mb-6'>
						{currentGameMode?.mode === GameMode.TIME_LIMITED
							? `Time's up! You played for ${formatTimeDisplay(timeElapsed)}`
							: currentGameMode?.mode === GameMode.QUESTION_LIMITED
								? `All questions completed in ${formatTimeDisplay(timeElapsed)}!`
								: `Great session! Time played: ${formatTimeDisplay(timeElapsed)}`}
					</p>
					<div className='space-y-3'>
						<Button
							variant={ButtonVariant.PRIMARY}
							size={ComponentSize.LG}
							className='w-full'
							onClick={() => window.location.reload()}
						>
							<Icon name='gamepad' size={ComponentSize.SM} className='mr-1' /> Play Again
						</Button>
						<Button
							variant={ButtonVariant.GHOST}
							size={ComponentSize.SM}
							className='w-full text-white/70 hover:text-white'
							onClick={onGameEnd}
						>
							Return to Menu
						</Button>
					</div>
				</motion.div>
			);
		}

		return null;
	};

	const renderGameInfo = () => {
		const info = [];

		if (currentGameMode?.mode === GameMode.QUESTION_LIMITED && currentGameMode?.questionLimit !== undefined) {
			info.push(
				<div key='questions' className='text-center'>
					<div className='text-sm opacity-75'>Questions Remaining</div>
					<div className='font-bold text-lg'>{currentGameMode.questionLimit}</div>
				</div>
			);
		}

		if (currentGameMode?.mode === GameMode.TIME_LIMITED && currentGameMode.timer?.timeRemaining !== undefined) {
			const isUrgent = currentGameMode.timer.timeRemaining < 30000;
			info.push(
				<div key='time' className='text-center'>
					<div className='text-sm opacity-75'>Time Remaining</div>
					<div className={`font-bold text-lg ${isUrgent ? 'text-red-400 animate-pulse' : ''}`}>
						{formatTimeDisplay(currentGameMode.timer.timeRemaining)}
					</div>
				</div>
			);
		}

		if (info.length > 0) {
			return (
				<motion.div
					variants={fadeInDown}
					initial='hidden'
					animate='visible'
					className='game-info p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg mb-4'
					whileHover={{ scale: 1.01 }}
				>
					<ResponsiveGrid minWidth='100px' gap={Spacing.MD} className='text-white'>
						{info}
					</ResponsiveGrid>
				</motion.div>
			);
		}

		return null;
	};

	const handleNextQuestion = async () => {
		if (gameMode?.mode === GameMode.UNLIMITED) {
			if (contextLoadNextQuestion) {
				await contextLoadNextQuestion();
			} else {
				await onNewQuestion?.();
			}
		}
	};

	return (
		<motion.section
			role='region'
			aria-label='Trivia Game'
			variants={fadeInUp}
			initial='hidden'
			animate='visible'
			className='game-container'
			whileHover={{ scale: 1.005 }}
		>
			{/* Game Timer */}
			{currentGameMode?.timer && <GameTimer timer={currentGameMode.timer} gameMode={currentGameMode} />}

			{/* Game Progress Info */}
			{renderGameInfo()}

			{/* Game Content */}
			{currentGameMode?.isGameOver ? (
				renderGameStatus()
			) : (
				<>
					{trivia && (
						<TriviaGame
							question={{
								id: trivia.id,
								question: trivia.question,
								answers: trivia.answers,
								correctAnswerIndex: trivia.correctAnswerIndex,
								difficulty: trivia.difficulty || 'medium',
								topic: trivia.topic || 'general',
								createdAt: new Date(),
								updatedAt: new Date(),
							}}
							onComplete={isCorrect => {
								// Handle trivia completion
								logger.gameInfo('Question completed', { isCorrect });
							}}
						/>
					)}

					{/* Next Question Button for Unlimited Mode */}
					{selected && gameMode?.mode === GameMode.UNLIMITED && (
						<motion.div
							variants={fadeInUp}
							initial='hidden'
							animate='visible'
							transition={{ delay: 1 }}
							className='mt-6 text-center'
						>
							<Button
								variant={ButtonVariant.PRIMARY}
								size={ComponentSize.LG}
								onClick={handleNextQuestion}
								className='bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
							>
								<Icon name='arrowright' size={ComponentSize.SM} className='mr-1' /> Next Question
							</Button>
						</motion.div>
					)}
				</>
			)}
		</motion.section>
	);
}
