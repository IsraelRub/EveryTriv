import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';

import { MULTIPLAYER_TIME_PER_QUESTION, RoomStatus, TIME_PERIODS_MS } from '@shared/constants';
import { calculateElapsedSeconds, getCorrectAnswerIndex, getDisplayNameFromUserFields } from '@shared/utils';

import {
	AlertVariant,
	AudioKey,
	AvatarSize,
	ButtonSize,
	ComponentSize,
	ExitGameButtonVariant,
	GameKey,
	GameSessionHudCounterLayout,
	LoadingMessages,
	Routes,
	TimerMode,
	VariantBase,
} from '@/constants';
import { audioService } from '@/services';
import { cn } from '@/utils';
import {
	Alert,
	AlertDescription,
	AnswerButton,
	Button,
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
	const {
		room,
		gameState,
		leaderboard,
		submitAnswer,
		leaveRoom,
		joinRoom,
		loadingStep,
		displayMessage,
		isConnected,
		error,
	} = useMultiplayer(roomId);
	const revealPhase = useAppSelector(state => state.multiplayer.revealPhase);
	const answerCountsForQuestionId = useAppSelector(state => state.multiplayer.answerCountsForQuestionId);

	const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

	const [selectionLocked, setSelectionLocked] = useState(false);
	const [resyncPrompt, setResyncPrompt] = useState(false);

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

	useEffect(() => {
		if (room?.status !== RoomStatus.PLAYING || gameState != null) {
			setResyncPrompt(false);
			return undefined;
		}
		const timeoutId = window.setTimeout(() => {
			setResyncPrompt(true);
		}, TIME_PERIODS_MS.EIGHT_SECONDS);
		return () => {
			window.clearTimeout(timeoutId);
		};
	}, [room?.status, room?.roomId, gameState]);

	// Lock selection when reveal phase starts (server ended question)
	useEffect(() => {
		if (revealPhase) setSelectionLocked(true);
	}, [revealPhase]);

	// Navigate to summary after feedback sound has time to play (revealPhase triggers sound; then game ends)
	useEffect(() => {
		if (room?.status !== RoomStatus.FINISHED || !roomId) return;
		const timeoutId = setTimeout(() => {
			navigate(Routes.MULTIPLAYER_SUMMARY.replace(':roomId', roomId));
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
		const showDisconnected =
			room != null &&
			!isConnected &&
			(room.status === RoomStatus.PLAYING || room.status === RoomStatus.STARTING || room.status === RoomStatus.WAITING);
		const showStuckResync =
			resyncPrompt &&
			isConnected &&
			room != null &&
			room.status === RoomStatus.PLAYING &&
			gameState == null &&
			roomId != null;

		let headline: string;
		if (showDisconnected) {
			headline = t(LoadingMessages.MULTIPLAYER_RECONNECTING);
		} else if (showStuckResync) {
			headline = t(LoadingMessages.MULTIPLAYER_RESYNCING_ROOM);
		} else {
			headline = t(displayMessage);
		}

		return (
			<main className='view-main animate-fade-in-only'>
				<div className='max-w-md mx-auto h-full flex flex-col items-center justify-center text-center gap-4 px-4'>
					<Spinner size={ComponentSize.XL} className='mx-auto text-primary' />
					<motion.h2
						key={`${loadingStep}-${showDisconnected}-${showStuckResync}`}
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						className='text-xl font-semibold'
					>
						{headline}
					</motion.h2>
					{showDisconnected && (
						<Alert variant={AlertVariant.DEFAULT} className='text-start'>
							<AlertDescription>{t(LoadingMessages.MULTIPLAYER_RECONNECTING)}</AlertDescription>
						</Alert>
					)}
					{showStuckResync && (
						<div className='flex w-full max-w-sm flex-col items-stretch gap-3'>
							<Alert variant={AlertVariant.DEFAULT} className='text-start'>
								<AlertDescription>{t(LoadingMessages.MULTIPLAYER_RESYNCING_ROOM)}</AlertDescription>
							</Alert>
							<Button type='button' variant={VariantBase.DEFAULT} size={ButtonSize.MD} onClick={() => joinRoom(roomId)}>
								{t(LoadingMessages.MULTIPLAYER_RESYNC_ACTION)}
							</Button>
						</div>
					)}
					{error != null && error !== '' && !showDisconnected && (
						<Alert variant={AlertVariant.DESTRUCTIVE} className='text-start'>
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}
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
							<CardContent className='flex min-h-0 flex-col px-4 pb-3 pt-0'>
								<div className='max-h-36 min-h-0 overflow-y-auto overflow-x-hidden pr-1'>
									<div className='flex flex-wrap gap-x-4 gap-y-2'>
										{(leaderboard.length > 0 ? leaderboard : (room?.players ?? [])).map((player, index) => {
											const isFirst = index === 0 && leaderboard.length > 0;
											return (
												<div
													key={player.userId}
													className={cn('flex min-w-0 max-w-full items-center gap-2', isFirst && 'font-semibold')}
												>
													<UserAvatar source={player} size={AvatarSize.SM} />
													<span className='max-w-[10rem] truncate text-sm sm:max-w-[12rem]'>
														{getDisplayNameFromUserFields(player)}
													</span>
													<span className='shrink-0 text-sm font-bold tabular-nums'>
														{'score' in player ? player.score : 0}
													</span>
												</div>
											);
										})}
									</div>
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
										navigate(Routes.MULTIPLAYER);
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
