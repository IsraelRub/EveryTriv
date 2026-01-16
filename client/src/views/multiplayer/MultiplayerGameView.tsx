import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Crown, XCircle } from 'lucide-react';

import { RoomStatus } from '@shared/constants';
import { calculateElapsedSeconds } from '@shared/utils';

import { SpinnerSize, VariantBase } from '@/constants';
import {
	AnswerButton,
	Avatar,
	AvatarFallback,
	Badge,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	GameTimer,
	Spinner,
} from '@/components';
import { useMultiplayer } from '@/hooks';
import { cn } from '@/utils';

export function MultiplayerGameView() {
	const { roomId } = useParams<string>();
	const navigate = useNavigate();

	const { room, gameState, leaderboard, submitAnswer, loadingStep, displayMessage } = useMultiplayer(roomId);

	const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
	const [answered, setAnswered] = useState(false);

	const currentQuestion = gameState?.currentQuestion;
	const questionIndex = gameState?.currentQuestionIndex ?? 0;
	const gameQuestionCount = gameState?.gameQuestionCount ?? 0;
	const timePerQuestion = room?.config.timePerQuestion ?? 30;
	const questionStartTime = gameState?.currentQuestionStartTime
		? new Date(gameState.currentQuestionStartTime).getTime()
		: undefined;
	const serverStartTimestamp = gameState?.serverStartTimestamp;
	const serverEndTimestamp = gameState?.serverEndTimestamp;

	// Reset state when question changes
	useEffect(() => {
		setSelectedAnswer(null);
		setAnswered(false);
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

		// Calculate time spent from question start (server timestamp)
		const timeSpent = questionStartTime ? calculateElapsedSeconds(questionStartTime) : 0;
		submitAnswer(roomId, currentQuestion.id, answerIndex, timeSpent);
	};

	if (!room || !gameState) {
		return (
			<motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='min-h-screen py-12 px-4'>
				<div className='max-w-md mx-auto text-center space-y-4'>
					<Spinner size={SpinnerSize.XL} variant='loader' className='mx-auto text-primary' />
					<motion.h2
						key={loadingStep}
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						className='text-xl font-semibold'
					>
						{displayMessage}
					</motion.h2>
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
								<GameTimer
									mode='countdown'
									initialTime={timePerQuestion}
									startTime={questionStartTime}
									serverStartTimestamp={serverStartTimestamp}
									serverEndTimestamp={serverEndTimestamp}
									key={questionIndex}
									label='Time Remaining'
								/>
							</CardContent>
						</Card>

						{/* Question - Scrollable if needed */}
						<Card className='flex-1 flex flex-col min-h-0 mb-3'>
							<CardContent className='pt-4 pb-4 flex-1 flex flex-col min-h-0'>
								<h2 className='text-xl font-bold mb-4 leading-tight flex-shrink-0'>
									{currentQuestion?.question ?? 'Loading question...'}
								</h2>
								<div className='grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 min-h-0'>
									{currentQuestion?.answers?.map((answer, index) => {
										const showResult = Boolean(answered && gameState?.playersAnswers);
										return (
											<AnswerButton
												key={index}
												answer={answer}
												index={index}
												answered={answered}
												selectedAnswer={selectedAnswer}
												currentQuestion={currentQuestion}
												onClick={handleAnswerSelect}
												showResult={showResult}
											/>
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
													<AvatarFallback className='text-xs'>{player.displayName?.charAt(0) ?? 'P'}</AvatarFallback>
												</Avatar>
												<div className='flex-1 min-w-0'>
													<div className='flex items-center gap-1'>
														{/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */}
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
														<AvatarFallback className='text-xs'>{player.displayName?.charAt(0) ?? 'P'}</AvatarFallback>
													</Avatar>
													{/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */}
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
												{/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */}
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
