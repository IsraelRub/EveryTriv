import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';

import { MULTIPLAYER_TIME_PER_QUESTION, RoomStatus, TIME_PERIODS_MS } from '@shared/constants';
import { calculateElapsedSeconds, getCorrectAnswerIndex, getDisplayNameFromUserFields } from '@shared/utils';

import {
	AudioKey,
	AvatarSize,
	ComponentSize,
	ExitGameButtonVariant,
	GameKey,
	GameSessionHudCounterLayout,
	LoadingMessages,
	ROUTES,
	TimerMode,
} from '@/constants';
import { audioService } from '@/services';
import { cn } from '@/utils';
import {
	AnswerButton,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	ExitGameButton,
	GameSessionHud,
	Spinner,
	UserAvatar,
} from '@/components';
import { useCurrentUserData, useMultiplayer } from '@/hooks';
import { useAppSelector } from '@/hooks/useRedux';

export function MultiplayerGameView() {
	const { t } = useTranslation(['game', 'loading']);
	const { roomId } = useParams<string>();
	const navigate = useNavigate();

	const currentUser = useCurrentUserData();
	const { room, gameState, leaderboard, submitAnswer, leaveRoom, loadingStep, displayMessage } = useMultiplayer(roomId);
	const revealPhase = useAppSelector(state => state.multiplayer.revealPhase);
	const answerCountsForQuestionId = useAppSelector(state => state.multiplayer.answerCountsForQuestionId);

	const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

	const [selectionLocked, setSelectionLocked] = useState(false);

	const selectedAnswerRef = useRef<number | null>(null);
	selectedAnswerRef.current = selectedAnswer;

	// Show as "selected" only this client's answer: from server (playersAnswers) or local state. Never show another player's choice as selected.
	const myAnswerFromServer =
		currentUser?.id != null && gameState?.playersAnswers != null ? gameState.playersAnswers[currentUser.id] : undefined;
	const displayedSelectedAnswer: number | null = myAnswerFromServer ?? selectedAnswer;

	const currentQuestion = gameState?.currentQuestion;
	const questionIndex = gameState?.currentQuestionIndex ?? 0;
	const gameQuestionCount = gameState?.gameQuestionCount ?? 0;
	const timePerQuestion = MULTIPLAYER_TIME_PER_QUESTION;
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
	const countsAreForCurrentQuestion = currentQuestion?.id != null && answerCountsForQuestionId === currentQuestion.id;
	const safeAnswerCounts = countsAreForCurrentQuestion ? answerCounts : undefined;
	const safeTotalPlayerCount = countsAreForCurrentQuestion ? totalPlayers : undefined;

	// Reset local UI state when question changes
	useEffect(() => {
		setSelectedAnswer(null);
		setSelectionLocked(false);
	}, [gameState?.currentQuestionIndex]);

	// Lock selection when reveal phase starts (server ended question)
	useEffect(() => {
		if (revealPhase) setSelectionLocked(true);
	}, [revealPhase]);

	// Navigate to summary after feedback sound has time to play (revealPhase triggers sound; then game ends)
	useEffect(() => {
		if (room?.status !== RoomStatus.FINISHED || !roomId) return;
		const timeoutId = setTimeout(() => {
			navigate(ROUTES.MULTIPLAYER_SUMMARY.replace(':roomId', roomId));
		}, TIME_PERIODS_MS.ONE_AND_HALF_SECONDS);
		return () => clearTimeout(timeoutId);
	}, [room?.status, roomId, navigate]);

	// Play correct/wrong sound when answer is revealed (revealPhase becomes true). Use same source as display: server when available, else local.
	const prevRevealPhaseRef = useRef(false);
	useEffect(() => {
		if (revealPhase && !prevRevealPhaseRef.current && currentQuestion) {
			const correctIndex = getCorrectAnswerIndex(currentQuestion);
			const choice = displayedSelectedAnswer;
			if (choice !== null) {
				const isCorrect = choice === correctIndex;
				audioService.play(isCorrect ? AudioKey.CORRECT_ANSWER : AudioKey.WRONG_ANSWER);
			}
		}
		prevRevealPhaseRef.current = revealPhase;
	}, [revealPhase, currentQuestion, displayedSelectedAnswer]);

	const handleAnswerSelect = (answerIndex: number) => {
		if (selectionLocked || revealPhase || !roomId || !currentQuestion?.id) return;
		const timeSpent = questionStartTime ? Math.max(1, calculateElapsedSeconds(questionStartTime)) : 0;
		setSelectedAnswer(answerIndex);
		submitAnswer(roomId, currentQuestion.id, answerIndex, timeSpent);
	};

	const handleTimerTimeout = useCallback(() => {
		setSelectionLocked(true);
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
						{t(displayMessage)}
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
								<GameSessionHud
									questionCurrent={questionIndex + 1}
									questionTotal={gameQuestionCount > 0 ? gameQuestionCount : undefined}
									counterLayout={GameSessionHudCounterLayout.MULTIPLAYER}
									timerKey={questionIndex}
									mode={TimerMode.COUNTDOWN}
									initialTime={timePerQuestion}
									startTime={questionStartTime}
									serverStartTimestamp={serverStartTimestamp}
									serverEndTimestamp={serverEndTimestamp}
									onTimeout={handleTimerTimeout}
									label={t(GameKey.TIME_REMAINING)}
								/>
							</CardContent>
						</Card>
						<Card className='flex-[1] min-w-0 basis-0'>
							<CardHeader className='py-2 px-4'>
								<CardTitle className='text-sm'>{t(GameKey.STANDINGS)}</CardTitle>
							</CardHeader>
							<CardContent className='pt-0 px-4 pb-3'>
								<div className='flex flex-wrap gap-x-4 gap-y-2'>
									{(leaderboard.length > 0 ? leaderboard : (room?.players ?? [])).map((player, index) => {
										const isFirst = index === 0 && leaderboard.length > 0;
										return (
											<div key={player.userId} className={cn('flex items-center gap-2', isFirst && 'font-semibold')}>
												<UserAvatar source={player} size={AvatarSize.SM} />
												<span className='text-sm truncate max-w-28'>{getDisplayNameFromUserFields(player)}</span>
												<span className='text-sm font-bold tabular-nums'>{'score' in player ? player.score : 0}</span>
											</div>
										);
									})}
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Question card; % who chose each answer shown only on answer buttons (one UX) */}
					<Card className='flex-1 flex flex-col min-h-0 mb-3 relative overflow-hidden'>
						<CardContent className='pt-4 pb-4 flex-1 flex flex-col min-h-0'>
							<h2 className='text-xl font-bold mb-4 leading-tight flex-shrink-0'>
								{currentQuestion?.question ?? t(LoadingMessages.LOADING_QUESTION)}
							</h2>
							<div className='relative flex flex-col flex-1 min-h-0'>
								<div className='relative'>
									<AnswerButton
										answers={currentQuestion?.answers}
										answered={selectionLocked}
										selectedAnswer={displayedSelectedAnswer}
										currentQuestion={currentQuestion}
										onAnswerClick={handleAnswerSelect}
										showResult={revealPhase}
										answerCounts={safeAnswerCounts}
										totalPlayerCount={safeTotalPlayerCount}
									/>
								</div>
							</div>

							<div className='mt-4 flex justify-center flex-shrink-0'>
								<ExitGameButton
									variant={ExitGameButtonVariant.ROOM}
									onConfirm={() => {
										leaveRoom();
										navigate(ROUTES.MULTIPLAYER);
									}}
								/>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</main>
	);
}
