import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';

import { RoomStatus } from '@shared/constants';
import { calculateElapsedSeconds, getCorrectAnswerIndex } from '@shared/utils';

import { AudioKey, AvatarSize, ComponentSize, DISPLAY_NAME_FALLBACKS, LoadingMessages, TimerMode } from '@/constants';
import {
	AnswerButton,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	GameTimer,
	QuestionCounter,
	Spinner,
	UserAvatar,
} from '@/components';
import { useMultiplayer } from '@/hooks';
import { useAppSelector } from '@/hooks/useRedux';
import { audioService } from '@/services';
import { cn, getDisplayNameFromPlayer } from '@/utils';

export function MultiplayerGameView() {
	const { roomId } = useParams<string>();
	const navigate = useNavigate();

	const { room, gameState, leaderboard, submitAnswer, loadingStep, displayMessage } = useMultiplayer(roomId);
	const revealPhase = useAppSelector(state => state.multiplayer.revealPhase);

	const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
	const [answered, setAnswered] = useState(false);

	const selectedAnswerRef = useRef<number | null>(null);
	selectedAnswerRef.current = selectedAnswer;

	const currentQuestion = gameState?.currentQuestion;
	const questionIndex = gameState?.currentQuestionIndex ?? 0;
	const gameQuestionCount = gameState?.gameQuestionCount ?? 0;
	const timePerQuestion = room?.config.timePerQuestion ?? 30;
	const isQuestionLoaded = !!(
		currentQuestion?.question &&
		currentQuestion?.answers &&
		currentQuestion.answers.length > 0
	);

	const questionStartTime =
		isQuestionLoaded && gameState?.currentQuestionStartTime
			? new Date(gameState.currentQuestionStartTime).getTime()
			: undefined;

	// Only pass server timestamps if question is loaded
	const serverStartTimestamp = isQuestionLoaded ? gameState?.serverStartTimestamp : undefined;
	const serverEndTimestamp = isQuestionLoaded ? gameState?.serverEndTimestamp : undefined;

	// Convert answerCounts from Record<string, number> to Record<number, number>
	const answerCounts = useMemo(() => {
		if (!gameState?.answerCounts) return undefined;
		const converted: Record<number, number> = {};
		Object.entries(gameState.answerCounts).forEach(([key, value]) => {
			const numKey = Number.parseInt(key, 10);
			if (!Number.isNaN(numKey)) {
				converted[numKey] = value;
			}
		});
		return Object.keys(converted).length > 0 ? converted : undefined;
	}, [gameState?.answerCounts]);

	const totalPlayers = room?.players?.length ?? 0;
	const totalAnsweredCount = gameState?.playersAnswers ? Object.keys(gameState.playersAnswers).length : 0;
	const answeredBarWidthPercent = totalPlayers > 0 ? (totalAnsweredCount / totalPlayers) * 100 : 0;

	// Reset state when question changes
	useEffect(() => {
		setSelectedAnswer(null);
		setAnswered(false);
	}, [gameState?.currentQuestionIndex]);

	// Lock selection when reveal phase starts (server ended question)
	useEffect(() => {
		if (revealPhase) setAnswered(true);
	}, [revealPhase]);

	// Navigate to summary when game ends
	useEffect(() => {
		if (room?.status === RoomStatus.FINISHED && roomId) {
			navigate(`/game/multiplayer/summary/${roomId}`);
		}
	}, [room?.status, roomId, navigate]);

	// Play correct/wrong sound when answer is revealed (revealPhase becomes true)
	const prevRevealPhaseRef = useRef(false);
	useEffect(() => {
		if (revealPhase && !prevRevealPhaseRef.current && currentQuestion) {
			const correctIndex = getCorrectAnswerIndex(currentQuestion);
			const choice = selectedAnswerRef.current;
			if (choice !== null) {
				const isCorrect = choice === correctIndex;
				audioService.play(isCorrect ? AudioKey.CORRECT_ANSWER : AudioKey.WRONG_ANSWER);
			}
		}
		prevRevealPhaseRef.current = revealPhase;
	}, [revealPhase, currentQuestion]);

	const handleAnswerSelect = (answerIndex: number) => {
		if (answered || !roomId || !currentQuestion?.id) return;
		const timeSpent = questionStartTime ? Math.max(1, calculateElapsedSeconds(questionStartTime)) : 0;
		setSelectedAnswer(answerIndex);
		submitAnswer(roomId, currentQuestion.id, answerIndex, timeSpent);
	};

	const handleTimerTimeout = useCallback(() => {
		setAnswered(true);
	}, []);

	if (!room || !gameState) {
		return (
			<main className='view-main animate-fade-in-only'>
				<div className='max-w-md mx-auto h-full flex items-center justify-center text-center space-y-4'>
					<Spinner size={ComponentSize.XL} className='mx-auto text-primary' />
					<motion.h2
						key={loadingStep}
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						className='text-xl font-semibold'
					>
						{displayMessage}
					</motion.h2>
				</div>
			</main>
		);
	}

	return (
		<main className='view-main animate-fade-in-only'>
			<div className='view-centered-6xl h-full flex flex-col'>
				<div className='flex flex-col flex-1 min-h-0'>
					{/* Timer + Leaderboard – fixed ratio 2:1, always one row */}
					<div className='flex flex-row gap-3 mb-3 flex-shrink-0 min-h-0'>
						<Card className='flex-[2] min-w-0 basis-0'>
							<CardContent className='pt-4 pb-4'>
								<div className='flex flex-col items-center text-center mb-3'>
									<QuestionCounter current={questionIndex + 1} total={gameQuestionCount} size={ComponentSize.MD} />
								</div>
								<GameTimer
									mode={TimerMode.COUNTDOWN}
									initialTime={timePerQuestion}
									startTime={questionStartTime}
									serverStartTimestamp={serverStartTimestamp}
									serverEndTimestamp={serverEndTimestamp}
									onTimeout={handleTimerTimeout}
									key={questionIndex}
									label='Time Remaining'
								/>
							</CardContent>
						</Card>
						<Card className='flex-[1] min-w-0 basis-0'>
							<CardHeader className='py-2 px-4'>
								<CardTitle className='text-sm'>Standings</CardTitle>
							</CardHeader>
							<CardContent className='pt-0 px-4 pb-3'>
								<div className='flex flex-wrap gap-x-4 gap-y-2'>
									{(leaderboard.length > 0 ? leaderboard : (room?.players ?? [])).map((player, index) => {
										const isFirst = index === 0 && leaderboard.length > 0;
										return (
											<div key={player.userId} className={cn('flex items-center gap-2', isFirst && 'font-semibold')}>
												<UserAvatar player={player} size={AvatarSize.SM} fallbackClassName='text-xs' />
												<span className='text-sm truncate max-w-28'>
													{getDisplayNameFromPlayer(player, DISPLAY_NAME_FALLBACKS.PLAYER_SHORT)}
												</span>
												<span className='text-sm font-bold tabular-nums'>{'score' in player ? player.score : 0}</span>
											</div>
										);
									})}
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Question card: strip at bottom shows % of players who answered (fixed muted opacity, width varies) */}
					<Card className='flex-1 flex flex-col min-h-0 mb-3 relative overflow-hidden'>
						{totalPlayers > 0 && (
							<div
								className='absolute bottom-0 left-0 h-1.5 bg-muted/80 transition-[width] duration-300 ease-out'
								style={{ width: `${answeredBarWidthPercent}%` }}
							/>
						)}
						<CardContent className='pt-4 pb-4 flex-1 flex flex-col min-h-0'>
							<h2 className='text-xl font-bold mb-4 leading-tight flex-shrink-0'>
								{currentQuestion?.question ?? LoadingMessages.LOADING_QUESTION}
							</h2>
							<div className='relative flex flex-col flex-1 min-h-0'>
								<div className='relative'>
									<AnswerButton
										answers={currentQuestion?.answers}
										answered={answered}
										selectedAnswer={selectedAnswer}
										currentQuestion={currentQuestion}
										onAnswerClick={handleAnswerSelect}
										showResult={revealPhase}
										answerCounts={answerCounts}
										totalPlayerCount={answerCounts !== undefined ? totalPlayers : undefined}
									/>
								</div>
							</div>

							{answered && (
								<motion.div
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									className='mt-4 text-center text-sm text-muted-foreground flex-shrink-0'
								>
									{LoadingMessages.WAITING_FOR_OTHER_PLAYERS}
								</motion.div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</main>
	);
}
