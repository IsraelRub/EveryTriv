import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Crown, XCircle } from 'lucide-react';

import { RoomStatus } from '@shared/constants';
import { calculateElapsedSeconds } from '@shared/utils';
import { SpinnerSize, SpinnerVariant, VariantBase } from '@/constants';
import { Avatar, AvatarFallback, Badge, Card, CardContent, CardHeader, CardTitle, GameTimer, Spinner } from '@/components';
import { useMultiplayer } from '@/hooks';
import { cn } from '@/utils';

export function MultiplayerGameView() {
	const { roomId } = useParams<string>();
	const navigate = useNavigate();

	const { room, gameState, leaderboard, submitAnswer } = useMultiplayer(roomId);

	const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
	const [answered, setAnswered] = useState(false);
	const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());

	const currentQuestion = gameState?.currentQuestion;
	const questionIndex = gameState?.currentQuestionIndex ?? 0;
	const gameQuestionCount = gameState?.gameQuestionCount ?? 0;
	const timePerQuestion = gameState?.timeRemaining || 30;

	// Reset state when question changes
	useEffect(() => {
		setSelectedAnswer(null);
		setAnswered(false);
		setQuestionStartTime(Date.now());
	}, [gameState?.currentQuestionIndex]);

	// Navigate to results when game ends
	useEffect(() => {
		if (room?.status === RoomStatus.FINISHED && roomId) {
			navigate(`/multiplayer/results/${roomId}`);
		}
	}, [room?.status, roomId, navigate]);

	const handleAnswerSelect = (answerIndex: number) => {
		if (answered || !roomId || !currentQuestion?.id) return;

		setSelectedAnswer(answerIndex);
		setAnswered(true);

		// Calculate time spent from question start
		const timeSpent = calculateElapsedSeconds(questionStartTime);
		submitAnswer(roomId, currentQuestion.id, answerIndex, timeSpent);
	};

	if (!room || !gameState) {
		return (
			<motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='min-h-screen py-12 px-4'>
				<div className='max-w-md mx-auto text-center space-y-4'>
					<Spinner variant={SpinnerVariant.BUTTON} size={SpinnerSize.XL} className='mx-auto text-primary' />
					<h2 className='text-xl font-semibold'>Loading game...</h2>
				</div>
			</motion.main>
		);
	}

	return (
		<motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='min-h-screen py-4 px-4'>
			<div className='max-w-6xl mx-auto h-screen flex flex-col'>
				<div className='grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0'>
					{/* Main Game Area */}
					<div className='lg:col-span-2 flex flex-col min-h-0'>
						{/* Timer - Compact */}
						<Card className='mb-3 flex-shrink-0'>
							<CardContent className='pt-4 pb-4'>
								<div className='flex items-center justify-between mb-3'>
									<Badge variant={VariantBase.OUTLINE} className='text-xs'>
										Question {questionIndex + 1} of {gameQuestionCount}
									</Badge>
								</div>
								<GameTimer mode='countdown' initialTime={timePerQuestion} key={questionIndex} label='Time Remaining' />
							</CardContent>
						</Card>

						{/* Question - Scrollable if needed */}
						<Card className='flex-1 flex flex-col min-h-0 mb-3'>
							<CardContent className='pt-4 pb-4 flex-1 flex flex-col min-h-0'>
								<h2 className='text-xl font-bold mb-4 leading-tight flex-shrink-0'>
									{currentQuestion?.question || 'Loading question...'}
								</h2>
								<div className='grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 min-h-0'>
									{currentQuestion?.answers?.map((answer, index) => {
										const isSelected = selectedAnswer === index;
										const showResult = answered && gameState?.playersAnswers;
										const isCorrect = answer.isCorrect;
										const isWrong = showResult && isSelected && !isCorrect;

										let styleClasses = '';
										if (!showResult) {
											if (isSelected) {
												styleClasses = 'bg-blue-500/50 ring-2 ring-blue-500/70';
											} else {
												styleClasses = 'hover:bg-accent hover:scale-[1.02] active:scale-[0.98]';
											}
										} else {
											if (isCorrect) {
												styleClasses = 'bg-green-500/40 ring-2 ring-green-500/70';
											} else if (isWrong) {
												styleClasses = 'bg-red-500/40 ring-2 ring-red-500/70';
											} else {
												styleClasses = 'opacity-50';
											}
										}

										return (
											<motion.button
												key={index}
												initial={{ opacity: 0, y: 10 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{ delay: index * 0.05 }}
												onClick={() => handleAnswerSelect(index)}
												disabled={answered}
												className={cn(
													'p-3 text-left border-2 border-white rounded-lg transition-all h-full flex items-center',
													styleClasses,
													answered ? 'cursor-not-allowed' : 'cursor-pointer'
												)}
											>
												<div className='flex items-center gap-3 w-full'>
													<span className='flex-shrink-0 w-7 h-7 rounded-full bg-muted flex items-center justify-center font-medium text-sm'>
														{String.fromCharCode(65 + index)}
													</span>
													<span className='flex-1 text-base leading-tight'>{answer.text}</span>
													{showResult && isCorrect && (
														<motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className='flex-shrink-0'>
															<CheckCircle className='h-4 w-4 text-green-500' />
														</motion.span>
													)}
													{isWrong && (
														<motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className='flex-shrink-0'>
															<XCircle className='h-4 w-4 text-red-500' />
														</motion.span>
													)}
													{isSelected && !showResult && (
														<motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className='flex-shrink-0'>
															<div className='h-4 w-4 rounded-full border-2 border-primary' />
														</motion.span>
													)}
												</div>
											</motion.button>
										);
									})}
								</div>

								{answered && (
									<motion.div
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										className='mt-4 text-center text-sm text-muted-foreground flex-shrink-0'
									>
										Waiting for other players...
									</motion.div>
								)}
							</CardContent>
						</Card>
					</div>

					{/* Leaderboard Sidebar - Scrollable */}
					<div className='space-y-3 flex flex-col min-h-0'>
						<Card className='flex-1 flex flex-col min-h-0 flex-shrink-0'>
							<CardHeader className='pb-3'>
								<CardTitle className='text-base'>Live Leaderboard</CardTitle>
							</CardHeader>
							<CardContent className='flex-1 overflow-y-auto'>
								<div className='space-y-2'>
									{leaderboard.length > 0 ? (
										leaderboard.map((player, index) => (
											<motion.div
												key={player.userId}
												initial={{ opacity: 0, x: 10 }}
												animate={{ opacity: 1, x: 0 }}
												transition={{ delay: index * 0.05 }}
												className={cn(
													'flex items-center gap-2 p-2 rounded-lg',
													index === 0 ? 'bg-yellow-500/30 ring-2 ring-yellow-500/50' : 'bg-muted/50'
												)}
											>
												<span className='font-bold text-sm w-5'>#{index + 1}</span>
												<Avatar className='h-7 w-7'>
													<AvatarFallback className='text-xs'>{player.displayName?.charAt(0) || 'P'}</AvatarFallback>
												</Avatar>
												<div className='flex-1 min-w-0'>
													<div className='flex items-center gap-1'>
														<span className='font-medium text-sm truncate'>{player.displayName || 'Player'}</span>
														{index === 0 && <Crown className='h-3 w-3 text-yellow-500 flex-shrink-0' />}
													</div>
												</div>
												<span className='font-bold text-primary text-sm'>{player.score}</span>
											</motion.div>
										))
									) : (
										<div className='space-y-2'>
											{room.players?.map((player, index) => (
												<div key={player.userId} className='flex items-center gap-2 p-2 rounded-lg bg-muted/50'>
													<span className='font-bold text-sm w-5'>#{index + 1}</span>
													<Avatar className='h-7 w-7'>
														<AvatarFallback className='text-xs'>{player.displayName?.charAt(0) || 'P'}</AvatarFallback>
													</Avatar>
													<span className='font-medium text-sm truncate'>{player.displayName || 'Player'}</span>
													<span className='font-bold text-muted-foreground ml-auto text-sm'>0</span>
												</div>
											))}
										</div>
									)}
								</div>
							</CardContent>
						</Card>

						{/* Answer Status - Compact */}
						<Card className='flex-shrink-0'>
							<CardHeader className='pb-3'>
								<CardTitle className='text-base'>Answer Status</CardTitle>
							</CardHeader>
							<CardContent>
								<div className='space-y-1.5'>
									{room.players?.map(player => {
										const hasAnswered = gameState?.playersAnswers?.[player.userId] !== undefined;
										return (
											<div key={player.userId} className='flex items-center gap-2'>
												{hasAnswered ? (
													<CheckCircle className='h-3.5 w-3.5 text-green-500 flex-shrink-0' />
												) : (
													<XCircle className='h-3.5 w-3.5 text-muted-foreground flex-shrink-0' />
												)}
												<span className='text-xs'>{player.displayName || 'Player'}</span>
											</div>
										);
									})}
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</motion.main>
	);
}
