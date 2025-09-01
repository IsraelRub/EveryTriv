import { formatTimeDisplay } from 'everytriv-shared/utils';
import { useCallback, useEffect, useState } from 'react';

import { useValueChange } from '../../hooks/layers/utils/usePrevious';
import { loggerService } from '../../services/utils/logger.service';
import { GameMode, GameProps } from '../../types';
import { FadeInDown, FadeInUp, ScaleIn } from '../animations';
import { Icon } from '../icons';
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
 * @param onAnswer - Answer selection handler
 * @param onNewQuestion - New question generation handler
 * @param gameMode - Current game mode configuration
 * @param onGameEnd - Game end handler
 * @returns JSX.Element The rendered game interface with all game elements
 */
export default function Game({ trivia, selected, score, onAnswer, onNewQuestion, gameMode, onGameEnd }: GameProps) {
	const [timeElapsed, setTimeElapsed] = useState(gameMode.timer.timeElapsed);
	const [timeRemaining, setTimeRemaining] = useState(gameMode.timeRemaining);
	const [isGameOver, setIsGameOver] = useState(gameMode.isGameOver);

	const scoreChange = useValueChange(score);

	useEffect(() => {
		if (!gameMode.timer.isRunning || isGameOver) return;

		const interval = setInterval(() => {
			const now = Date.now();
			const startTime = gameMode.timer.startTime || now;
			const elapsed = now - startTime;

			setTimeElapsed(elapsed);

			if (gameMode.mode === GameMode.TIME_LIMITED && gameMode.timeLimit) {
				const remaining = Math.max(0, gameMode.timeLimit - elapsed);
				setTimeRemaining(remaining);

				if (remaining <= 0) {
					setIsGameOver(true);
					onGameEnd();
				}
			}
		}, 1000);

		return () => clearInterval(interval);
	}, [gameMode.timer.isRunning, gameMode.timer.startTime, gameMode.mode, gameMode.timeLimit, isGameOver, onGameEnd]);

	useEffect(() => {
		if (
			gameMode.mode === GameMode.QUESTION_LIMITED &&
			gameMode.questionsRemaining !== undefined &&
			gameMode.questionsRemaining <= 0
		) {
			setIsGameOver(true);
			onGameEnd();
		}
	}, [gameMode.mode, gameMode.questionsRemaining, onGameEnd]);

	useEffect(() => {
		setIsGameOver(gameMode.isGameOver);
	}, [gameMode.isGameOver]);

	const handleAnswer = useCallback(
		async (index: number) => {
			await onAnswer(index);

			if (scoreChange.hasChanged && score > (scoreChange.previous || 0)) {
				    loggerService.userDebug('Score increased! Animation triggered');
			}

			if ((gameMode.mode === GameMode.TIME_LIMITED || gameMode.mode === GameMode.QUESTION_LIMITED) && !isGameOver) {
				setTimeout(async () => {
					if (gameMode.questionsRemaining && gameMode.questionsRemaining > 1) {
						await onNewQuestion();
					}
				}, 2000);
			}
		},
		[onAnswer, onNewQuestion, gameMode.mode, gameMode.questionsRemaining, isGameOver, scoreChange, score]
	);

	const renderGameStatus = () => {
		if (isGameOver) {
			return (
				<ScaleIn className='game-over p-6 glass rounded-lg text-center mb-6'>
					<div className='text-4xl mb-4'>🎉</div>
					<h2 className='text-2xl font-bold text-white mb-4'>Game Complete!</h2>
					<p className='text-lg text-white/80 mb-6'>
						{gameMode.mode === GameMode.TIME_LIMITED
							? `Time's up! You played for ${formatTimeDisplay(timeElapsed)}`
							: gameMode.mode === GameMode.QUESTION_LIMITED
								? `All questions completed in ${formatTimeDisplay(timeElapsed)}!`
								: `Great session! Time played: ${formatTimeDisplay(timeElapsed)}`}
					</p>
					<div className='space-y-3'>
						<Button variant='primary' size='lg' className='w-full' onClick={() => window.location.reload()}>
							<Icon name='gamepad' size='sm' className='mr-1' /> Play Again
						</Button>
						<Button variant='ghost' size='sm' className='w-full text-white/70 hover:text-white' onClick={onGameEnd}>
							Return to Menu
						</Button>
					</div>
				</ScaleIn>
			);
		}

		return null;
	};

	const renderGameInfo = () => {
		const info = [];

		if (gameMode.mode === GameMode.QUESTION_LIMITED && gameMode.questionsRemaining !== undefined) {
			info.push(
				<div key='questions' className='text-center'>
					<div className='text-sm opacity-75'>Questions Remaining</div>
					<div className='font-bold text-lg'>{gameMode.questionsRemaining}</div>
				</div>
			);
		}

		if (gameMode.mode === GameMode.TIME_LIMITED && timeRemaining !== undefined) {
			const isUrgent = timeRemaining < 30000;
			info.push(
				<div key='time' className='text-center'>
					<div className='text-sm opacity-75'>Time Remaining</div>
					<div className={`font-bold text-lg ${isUrgent ? 'text-red-400 animate-pulse' : ''}`}>
						{formatTimeDisplay(timeRemaining)}
					</div>
				</div>
			);
		}

		if (info.length > 0) {
			return (
				<FadeInDown className='game-info p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg mb-4'>
					<div className={`grid grid-cols-${info.length} gap-4 text-white`}>{info}</div>
				</FadeInDown>
			);
		}

		return null;
	};

	const handleNextQuestion = async () => {
		if (gameMode.mode === GameMode.UNLIMITED) {
			await onNewQuestion();
		}
	};

	return (
		<FadeInUp className='game-container'>
			{/* Game Timer */}
			<GameTimer
				isRunning={gameMode.timer.isRunning}
				timeElapsed={timeElapsed}
				timeRemaining={timeRemaining || 0}
				isGameOver={isGameOver}
				mode={gameMode.mode}
				onTimeUp={onGameEnd}
			/>

			{/* Game Progress Info */}
			{renderGameInfo()}

			{/* Game Content */}
			{isGameOver ? (
				renderGameStatus()
			) : (
				<>
					{trivia && (
						<TriviaGame
							trivia={trivia}
							selected={selected}
							onAnswer={handleAnswer}
							onNewQuestion={onNewQuestion}
							gameMode={gameMode}
							onGameEnd={onGameEnd}
							onComplete={(score: number) => {
								loggerService.gameStatistics(`Game completed with score: ${score}`);
							}}
						/>
					)}

					{/* Next Question Button for Unlimited Mode */}
					{selected !== null && gameMode.mode === GameMode.UNLIMITED && (
						<FadeInUp className='mt-6 text-center' delay={1}>
							<Button
								variant='primary'
								size='lg'
								onClick={handleNextQuestion}
								className='bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
							>
								<Icon name='arrowright' size='sm' className='mr-1' /> Next Question
							</Button>
						</FadeInUp>
					)}
				</>
			)}
		</FadeInUp>
	);
}
