/**
 * Multiplayer Game View
 *
 * @module MultiplayerGameView
 * @description Main game view for simultaneous multiplayer trivia
 * @used_by client/src/AppRoutes.tsx
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { motion } from 'framer-motion';

import { Button, Card, CardContent, Container, fadeInUp, LiveLeaderboard, QuestionTimer } from '../../components';
import { AudioKey, ButtonVariant, ComponentSize, ContainerSize } from '../../constants';
import { useMultiplayer, useUserProfile } from '../../hooks';
import { audioService } from '../../services';

export default function MultiplayerGameView() {
	const { roomId } = useParams<{ roomId: string }>();
	const navigate = useNavigate();
	const { room, gameState, leaderboard, submitAnswer, error } = useMultiplayer();
	const { data: userProfile } = useUserProfile();

	const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
	const [answered, setAnswered] = useState(false);
	const [startTime, setStartTime] = useState<number | null>(null);
	const [localTimeRemaining, setLocalTimeRemaining] = useState<number>(0);

	const currentQuestion = gameState?.currentQuestion;
	const serverTimeRemaining = gameState?.timeRemaining || 0;
	const timeRemaining = localTimeRemaining > 0 ? localTimeRemaining : serverTimeRemaining;

	// Reset when new question starts
	useEffect(() => {
		if (currentQuestion) {
			setStartTime(Date.now());
			setSelectedAnswer(null);
			setAnswered(false);
			// Initialize local timer with server value
			setLocalTimeRemaining(serverTimeRemaining);
		}
	}, [currentQuestion?.id, serverTimeRemaining]);

	// Update local timer every second
	useEffect(() => {
		if (!currentQuestion || answered || localTimeRemaining <= 0) {
			return;
		}

		const interval = setInterval(() => {
			setLocalTimeRemaining(prev => {
				const newValue = Math.max(0, prev - 1);
				return newValue;
			});
		}, 1000);

		return () => clearInterval(interval);
	}, [currentQuestion, answered, localTimeRemaining]);

	// Sync with server time remaining when it changes (for reconnection or server updates)
	useEffect(() => {
		if (serverTimeRemaining > 0 && Math.abs(serverTimeRemaining - localTimeRemaining) > 2) {
			setLocalTimeRemaining(serverTimeRemaining);
		}
	}, [serverTimeRemaining]);

	const handleAnswerSelect = (answerIndex: number) => {
		if (answered || !currentQuestion || !roomId) return;

		setSelectedAnswer(answerIndex);
		setAnswered(true);
		const finalTimeSpent = (Date.now() - (startTime || Date.now())) / 1000;

		submitAnswer(roomId, currentQuestion.id, answerIndex, finalTimeSpent);
		audioService.play(AudioKey.GAME_START);
	};

	if (!room || !gameState) {
		return (
			<Container size={ContainerSize.LG} className='py-8'>
				<div className='text-center text-white'>Loading game...</div>
			</Container>
		);
	}

	if (room.status === 'finished') {
		navigate(`/multiplayer/results/${roomId}`);
		return null;
	}

	return (
		<Container size={ContainerSize.LG} className='py-8'>
			<motion.div variants={fadeInUp} initial='hidden' animate='visible' className='space-y-6'>
				{/* Header with timer and question info */}
				<div className='flex items-center justify-between'>
					<div>
						<h2 className='text-2xl font-bold text-white'>
							Question {gameState.currentQuestionIndex + 1} of {gameState.totalQuestions}
						</h2>
					</div>
					<QuestionTimer timeRemaining={timeRemaining} totalTime={30} className='flex-shrink-0' />
				</div>

				<div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
					{/* Main game area */}
					<div className='lg:col-span-2 space-y-6'>
						{currentQuestion && (
							<Card>
								<CardContent className='p-6 space-y-6'>
									<h3 className='text-xl font-semibold text-white'>{currentQuestion.question}</h3>

									<div className='space-y-3'>
										{currentQuestion.answers.map((answer, index) => {
											const isSelected = selectedAnswer === index;
											const isDisabled = answered;
											const answerText = typeof answer === 'string' ? answer : answer.text || '';

											return (
												<Button
													key={index}
													variant={isSelected ? ButtonVariant.PRIMARY : ButtonVariant.SECONDARY}
													size={ComponentSize.LG}
													onClick={() => handleAnswerSelect(index)}
													disabled={isDisabled}
													className='w-full text-left justify-start'
												>
													{answerText}
												</Button>
											);
										})}
									</div>

									{answered && (
										<div className='mt-4 p-4 bg-blue-500/20 border border-blue-500 rounded text-blue-200'>
											Answer submitted! Waiting for other players...
										</div>
									)}
								</CardContent>
							</Card>
						)}
					</div>

					{/* Sidebar with leaderboard */}
					<div className='lg:col-span-1'>
						<LiveLeaderboard
							leaderboard={leaderboard}
							currentUserId={userProfile?.profile?.id}
							className='sticky top-4'
						/>
					</div>
				</div>

				{error && <div className='bg-red-500/20 border border-red-500 text-red-200 px-4 py-2 rounded'>{error}</div>}
			</motion.div>
		</Container>
	);
}
