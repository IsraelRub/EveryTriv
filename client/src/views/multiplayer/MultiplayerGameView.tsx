import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { motion } from 'framer-motion';
import { CheckCircle, Clock, Crown, Loader2, XCircle } from 'lucide-react';

import { Avatar, AvatarFallback, Badge, Card, CardContent, CardHeader, CardTitle, Progress } from '@/components';
import { useMultiplayer, useMultiplayerRoom } from '@/hooks';

export function MultiplayerGameView() {
	const { roomId } = useParams<{ roomId: string }>();
	const navigate = useNavigate();

	const { room } = useMultiplayerRoom(roomId);
	const { gameState, leaderboard, submitAnswer } = useMultiplayer();

	const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
	const [timeRemaining, setTimeRemaining] = useState(30);
	const [answered, setAnswered] = useState(false);

	const currentQuestion = gameState?.currentQuestion;
	const questionIndex = gameState?.currentQuestionIndex || 0;
	const gameQuestionCount = gameState?.gameQuestionCount || 0;

	// Timer countdown
	useEffect(() => {
		if (gameState?.timeRemaining) {
			setTimeRemaining(gameState.timeRemaining);
		}

		const timer = setInterval(() => {
			setTimeRemaining(prev => {
				if (prev <= 1) {
					clearInterval(timer);
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(timer);
	}, [gameState?.timeRemaining, gameState?.currentQuestionIndex]);

	// Reset state when question changes
	useEffect(() => {
		setSelectedAnswer(null);
		setAnswered(false);
	}, [gameState?.currentQuestionIndex]);

	// Navigate to results when game ends
	useEffect(() => {
		if (room?.status === 'finished' && roomId) {
			navigate(`/multiplayer/results/${roomId}`);
		}
	}, [room?.status, roomId, navigate]);

	const handleAnswerSelect = (answerIndex: number) => {
		if (answered || !roomId || !currentQuestion?.id) return;

		setSelectedAnswer(answerIndex);
		setAnswered(true);

		const timeSpent = (gameState?.timeRemaining || 30) - timeRemaining;
		submitAnswer(roomId, currentQuestion.id, answerIndex, timeSpent);
	};

	if (!room || !gameState) {
		return (
			<motion.main
				role='main'
				aria-label='Multiplayer Game'
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				className='min-h-screen py-12 px-4'
			>
				<div className='max-w-md mx-auto text-center space-y-4'>
					<Loader2 className='h-12 w-12 animate-spin mx-auto text-primary' />
					<h2 className='text-xl font-semibold'>Loading game...</h2>
				</div>
			</motion.main>
		);
	}

	const timerPercentage = (timeRemaining / (gameState?.timeRemaining || 30)) * 100;

	return (
		<motion.main
			role='main'
			aria-label='Multiplayer Game'
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			className='min-h-screen py-8 px-4'
		>
			<div className='max-w-6xl mx-auto'>
				<div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
					{/* Main Game Area */}
					<div className='lg:col-span-2 space-y-6'>
						{/* Timer and Progress */}
						<Card>
							<CardContent className='pt-6'>
								<div className='flex items-center justify-between mb-4'>
									<Badge variant='outline'>
										Question {questionIndex + 1} of {gameQuestionCount}
									</Badge>
									<div className='flex items-center gap-2'>
										<Clock className={`h-5 w-5 ${timeRemaining <= 10 ? 'text-red-500' : 'text-muted-foreground'}`} />
										<span className={`font-bold text-lg ${timeRemaining <= 10 ? 'text-red-500' : ''}`}>
											{timeRemaining}s
										</span>
									</div>
								</div>
								<Progress
									value={timerPercentage}
									className={`h-2 ${timeRemaining <= 10 ? '[&>div]:bg-red-500' : ''}`}
								/>
							</CardContent>
						</Card>

						{/* Question */}
						<Card>
							<CardContent className='pt-6'>
								<h2 className='text-2xl font-bold mb-6'>{currentQuestion?.question || 'Loading question...'}</h2>
								<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
									{currentQuestion?.answers?.map((answer, index) => {
										const isSelected = selectedAnswer === index;
										const showResult = answered && gameState?.playersAnswers;
										const isCorrect = answer.isCorrect;
										const isWrong = showResult && isSelected && !isCorrect;

										return (
											<motion.button
												key={index}
												initial={{ opacity: 0, y: 10 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{ delay: index * 0.1 }}
												onClick={() => handleAnswerSelect(index)}
												disabled={answered}
												className={`
													p-4 text-left border rounded-lg transition-all
													${isSelected ? 'border-primary bg-primary/10' : 'hover:bg-accent'}
													${answered ? 'cursor-not-allowed' : 'cursor-pointer'}
													${showResult && isCorrect ? 'ring-2 ring-green-500 bg-green-500/10' : ''}
													${isWrong ? 'ring-2 ring-red-500 bg-red-500/10' : ''}
												`}
											>
												<div className='flex items-center gap-3'>
													<span className='flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center font-medium'>
														{String.fromCharCode(65 + index)}
													</span>
													<span className='flex-1'>{answer.text}</span>
													{showResult && isCorrect && (
														<motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>
															<CheckCircle className='h-5 w-5 text-green-500' />
														</motion.span>
													)}
													{isWrong && (
														<motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>
															<XCircle className='h-5 w-5 text-red-500' />
														</motion.span>
													)}
													{isSelected && !showResult && (
														<motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>
															<div className='h-5 w-5 rounded-full border-2 border-primary' />
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
										className='mt-6 text-center text-muted-foreground'
									>
										Waiting for other players...
									</motion.div>
								)}
							</CardContent>
						</Card>
					</div>

					{/* Leaderboard Sidebar */}
					<div className='space-y-6'>
						<Card>
							<CardHeader>
								<CardTitle className='text-lg'>Live Leaderboard</CardTitle>
							</CardHeader>
							<CardContent>
								<div className='space-y-3'>
									{leaderboard.length > 0 ? (
										leaderboard.map((player, index) => (
											<motion.div
												key={player.userId}
												initial={{ opacity: 0, x: 10 }}
												animate={{ opacity: 1, x: 0 }}
												transition={{ delay: index * 0.05 }}
												className={`
													flex items-center gap-3 p-3 rounded-lg
													${index === 0 ? 'bg-yellow-500/10' : 'bg-muted/50'}
												`}
											>
												<span className='font-bold text-lg w-6'>#{index + 1}</span>
												<Avatar className='h-8 w-8'>
													<AvatarFallback>{player.displayName?.charAt(0) || 'P'}</AvatarFallback>
												</Avatar>
												<div className='flex-1 min-w-0'>
													<div className='flex items-center gap-1'>
														<span className='font-medium truncate'>{player.displayName || 'Player'}</span>
														{index === 0 && <Crown className='h-4 w-4 text-yellow-500 flex-shrink-0' />}
													</div>
												</div>
												<span className='font-bold text-primary'>{player.score}</span>
											</motion.div>
										))
									) : (
										<div className='space-y-3'>
											{room.players?.map((player, index) => (
												<div key={player.userId} className='flex items-center gap-3 p-3 rounded-lg bg-muted/50'>
													<span className='font-bold text-lg w-6'>#{index + 1}</span>
													<Avatar className='h-8 w-8'>
														<AvatarFallback>{player.displayName?.charAt(0) || 'P'}</AvatarFallback>
													</Avatar>
													<span className='font-medium truncate'>{player.displayName || 'Player'}</span>
													<span className='font-bold text-muted-foreground ml-auto'>0</span>
												</div>
											))}
										</div>
									)}
								</div>
							</CardContent>
						</Card>

						{/* Answer Status */}
						<Card>
							<CardHeader>
								<CardTitle className='text-lg'>Answer Status</CardTitle>
							</CardHeader>
							<CardContent>
								<div className='space-y-2'>
									{room.players?.map(player => {
										const hasAnswered = gameState?.playersAnswers?.[player.userId] !== undefined;
										return (
											<div key={player.userId} className='flex items-center gap-2'>
												{hasAnswered ? (
													<CheckCircle className='h-4 w-4 text-green-500' />
												) : (
													<XCircle className='h-4 w-4 text-muted-foreground' />
												)}
												<span className='text-sm'>{player.displayName || 'Player'}</span>
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
