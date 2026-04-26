import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Grid2x2Check, Grid2x2Plus, Play } from 'lucide-react';

import {
	DEFAULT_GAME_CONFIG,
	GAME_MODES_CONFIG,
	GameMode,
	RoomStatus,
	VALIDATION_COUNT,
	VALIDATION_LENGTH,
} from '@shared/constants';
import type { CreateRoomConfig } from '@shared/types';
import { getErrorMessage, isRecord } from '@shared/utils';

import {
	AlertVariant,
	ButtonSize,
	ComponentSize,
	ExitGameButtonVariant,
	GameKey,
	Routes,
	TabsListVariant,
	TextLanguageStatus,
	VALIDATION_MESSAGES,
	VariantBase,
} from '@/constants';
import { clientLogger as logger } from '@/services';
import { cn, getTranslatedErrorMessage, toLobbyPlayerRowsFromMultiplayerRoom } from '@/utils';
import {
	Alert,
	AlertDescription,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	ExitGameButton,
	Input,
	Label,
	LobbyGameDetailsCard,
	LobbyPlayersCard,
	LobbyRoomCodeBlock,
	Spinner,
	Switch,
	Tabs,
	TabsContent,
} from '@/components';
import { GameSettingsFlowIssuesAlert, GameSettingsForm, mergeGameSettingsFlowIssueMessages } from '@/components/game';
import { TabsBar } from '@/components/layout';
import { useAppSelector, useCanPlay, useCopyRoomCode, useGameSettingsForm, useMultiplayer, useUserRole } from '@/hooks';
import { selectLocale } from '@/redux/selectors';

export function MultiplayerLobbyView() {
	const { t } = useTranslation(['game', 'loading']);
	const { t: tGlobal } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();
	const outputLanguage = useAppSelector(selectLocale);

	// Shared game settings form state & validation
	const {
		topic,
		topicError,
		topicLanguageStatus,
		topicLanguageError,
		selectedDifficulty,
		customDifficulty,
		customDifficultyError,
		customDifficultyLanguageStatus,
		customDifficultyLanguageError,
		answerCount,
		canSubmitLanguage,
		handleTopicChange,
		setSelectedDifficulty,
		setCustomDifficulty,
		setCustomDifficultyError,
		setAnswerCount,
		validateSettings,
		validateTriviaTopicGate,
	} = useGameSettingsForm();

	const {
		room,
		isLoading,
		isConnected,
		error,
		isHost,
		isReadyToStart,
		roomCode,
		createRoom,
		joinRoom,
		leaveRoom,
		startGame,
		updatePublicLobbyVisibility,
		loadingStep,
		displayMessage,
	} = useMultiplayer();
	const { isAdmin } = useUserRole();
	const questionsCount =
		room?.config?.questionsPerRequest ??
		room?.questions?.length ??
		GAME_MODES_CONFIG[GameMode.MULTIPLAYER].defaults.maxQuestionsPerGame ??
		10;
	const playerCount = room?.players?.length ?? 0;
	const requiredCredits = questionsCount * playerCount;
	const { data: hostCanPlay } = useCanPlay(
		playerCount >= VALIDATION_COUNT.PLAYERS.MIN ? requiredCredits : 0,
		GameMode.MULTIPLAYER
	);
	const canHostAffordGame = isAdmin || (playerCount < VALIDATION_COUNT.PLAYERS.MIN ? true : hostCanPlay);

	const [joinRoomId, setJoinRoomId] = useState('');
	const [lobbyUiTab, setLobbyUiTab] = useState<'create' | 'join'>('create');

	const joinFromQueryHandledForSearchRef = useRef<string | null>(null);

	const { copied: roomCodeCopied, copy: copyRoomCode } = useCopyRoomCode(roomCode);

	const lobbyPlayerRows = useMemo(() => (room ? toLobbyPlayerRowsFromMultiplayerRoom(room) : []), [room]);

	const [createRoomFlowIssues, setCreateRoomFlowIssues] = useState<string[]>([]);

	const lobbyNoRoomBannerIssues = useMemo(() => {
		const connection = error ? [error] : [];
		if (lobbyUiTab === 'join') {
			return mergeGameSettingsFlowIssueMessages(connection);
		}
		return mergeGameSettingsFlowIssueMessages(connection, createRoomFlowIssues, [topicError], [customDifficultyError]);
	}, [lobbyUiTab, error, createRoomFlowIssues, topicError, customDifficultyError]);

	const [gameSettings, setGameSettings] = useState<CreateRoomConfig>({
		topic: DEFAULT_GAME_CONFIG.defaultTopic,
		difficulty: selectedDifficulty,
		questionsPerRequest: GAME_MODES_CONFIG[GameMode.MULTIPLAYER].defaults.maxQuestionsPerGame ?? 10,
		maxPlayers: VALIDATION_COUNT.PLAYERS.DEFAULT,
		isPublicLobby: false,
	});

	const createRoomHostCreditPreview = useMemo(() => {
		const questions = gameSettings.questionsPerRequest;
		const maxPlayers = gameSettings.maxPlayers;
		const minPlayers = VALIDATION_COUNT.PLAYERS.MIN;
		return {
			questions,
			minPlayers,
			maxPlayers,
			minTotal: questions * minPlayers,
			maxTotal: questions * maxPlayers,
			minPerQuestion: minPlayers,
			maxPerQuestion: maxPlayers,
		};
	}, [gameSettings.questionsPerRequest, gameSettings.maxPlayers]);

	const handleCreateRoom = async () => {
		setCreateRoomFlowIssues([]);
		const validation = validateSettings({ applyFieldErrors: false });
		if (!validation.isValid) {
			setCreateRoomFlowIssues(validation.issues);
			return;
		}
		const { finalDifficulty } = validation;

		try {
			await validateTriviaTopicGate(finalDifficulty);
		} catch (gateError) {
			const message = getTranslatedErrorMessage(tGlobal, gateError);
			logger.userError('Trivia topic gate failed from multiplayer create room', {
				errorInfo: { message: isRecord(gateError) ? getErrorMessage(gateError) : String(gateError) },
			});
			setCreateRoomFlowIssues([message]);
			return;
		}

		await createRoom({
			...gameSettings,
			topic: topic.trim() || DEFAULT_GAME_CONFIG.defaultTopic,
			difficulty: finalDifficulty,
			answerCount,
			outputLanguage,
			isPublicLobby: Boolean(gameSettings.isPublicLobby),
		});
	};

	const handleJoinRoom = async () => {
		const trimmed = joinRoomId.trim();
		if (!trimmed) {
			logger.userError(VALIDATION_MESSAGES.ROOM_CODE_REQUIRED);
			return;
		}
		await joinRoom(trimmed);
	};

	useEffect(() => {
		if (error) {
			logger.userError(error);
		}
	}, [error]);

	useEffect(() => {
		setCreateRoomFlowIssues([]);
	}, [topic, customDifficulty, selectedDifficulty]);

	useEffect(() => {
		if (lobbyUiTab === 'join') {
			setCreateRoomFlowIssues([]);
		}
	}, [lobbyUiTab]);

	useEffect(() => {
		const params = new URLSearchParams(location.search);
		const join = params.get('join');
		if (!join || join.length !== VALIDATION_LENGTH.ROOM_CODE.LENGTH) {
			joinFromQueryHandledForSearchRef.current = null;
			return;
		}
		const code = join.toUpperCase();
		if (!room) {
			setJoinRoomId(code);
			setLobbyUiTab('join');
		}
		if (!isConnected || room) {
			return;
		}
		if (joinFromQueryHandledForSearchRef.current === location.search) {
			return;
		}
		joinFromQueryHandledForSearchRef.current = location.search;
		void joinRoom(code);
	}, [location.search, isConnected, room, joinRoom]);

	useEffect(() => {
		if (!room?.roomId) {
			return;
		}
		const params = new URLSearchParams(location.search);
		const join = params.get('join');
		if (!join || join.toUpperCase() !== room.roomId) {
			return;
		}
		params.delete('join');
		const qs = params.toString();
		navigate({ pathname: Routes.MULTIPLAYER, search: qs ? `?${qs}` : '' }, { replace: true });
	}, [room?.roomId, location.search, navigate]);

	// Navigate to game view if game has started
	useEffect(() => {
		if (room?.status === RoomStatus.PLAYING && room.roomId) {
			navigate(Routes.MULTIPLAYER_PLAY.replace(':roomId', room.roomId));
		}
	}, [room?.status, room?.roomId, navigate]);

	if (!isConnected) {
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
					<p className='text-muted-foreground'>{t(GameKey.PLEASE_WAIT_CONNECTION)}</p>
				</div>
			</main>
		);
	}

	// If in a room, show the lobby
	if (room) {
		return (
			<main className='view-main animate-fade-in-up-simple'>
				<div className='view-content-2xl-scroll'>
					<div className='flex-shrink-0 space-y-3 text-center md:space-y-4'>
						<h1 className='mb-1 text-2xl font-bold md:mb-2 md:text-3xl'>{t(GameKey.MULTIPLAYER_LOBBY)}</h1>
						<div className='flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-6 sm:gap-y-3'>
							{roomCode ? (
								<LobbyRoomCodeBlock roomCode={roomCode} copied={roomCodeCopied} onCopy={copyRoomCode} />
							) : null}
							<div className='flex w-full justify-center sm:w-auto sm:shrink-0'>
								<ExitGameButton
									variant={ExitGameButtonVariant.ROOM}
									onConfirm={leaveRoom}
									size={ButtonSize.LG}
									disabled={isLoading}
								/>
							</div>
						</div>
					</div>

					{error && (
						<Alert variant={AlertVariant.DESTRUCTIVE}>
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}

					<LobbyPlayersCard
						players={lobbyPlayerRows}
						maxPlayers={room.config?.maxPlayers ?? VALIDATION_COUNT.PLAYERS.MAX}
					/>

					<LobbyGameDetailsCard
						topic={room.config?.topic ?? DEFAULT_GAME_CONFIG.defaultTopic}
						difficulty={room.config?.difficulty ?? DEFAULT_GAME_CONFIG.defaultDifficulty}
						questionsCount={questionsCount}
						status={room.status}
						statusTrailing={
							room.status === RoomStatus.STARTING ? <Spinner size={ComponentSize.SM} className='shrink-0' /> : undefined
						}
					/>

					{isHost && room.status === RoomStatus.WAITING && (
						<div
							className={cn(
								'rounded-lg border p-3 transition-colors',
								room.isPublicLobby ? 'border-primary/50 bg-primary/5' : 'border-border/60 bg-muted/30'
							)}
						>
							<div className='flex items-center justify-between gap-3'>
								<Label htmlFor='public-lobby-host' className='cursor-pointer text-sm font-semibold leading-snug'>
									{t(GameKey.PUBLIC_LOBBY_LIST_HOME_LABEL)}
								</Label>
								<Switch
									id='public-lobby-host'
									checked={room.isPublicLobby ?? false}
									onCheckedChange={next => updatePublicLobbyVisibility(next)}
									className='shrink-0'
								/>
							</div>
							<p className='mt-1.5 text-xs text-muted-foreground'>{t(GameKey.PUBLIC_LOBBY_LIST_HOME_SUBTITLE)}</p>
							<p className='mt-1.5 text-sm text-muted-foreground'>{t(GameKey.PUBLIC_LOBBY_LIST_HOME_DESCRIPTION)}</p>
						</div>
					)}

					{isHost && !canHostAffordGame && playerCount >= VALIDATION_COUNT.PLAYERS.MIN && (
						<Alert variant={AlertVariant.DESTRUCTIVE}>
							<AlertDescription className='flex flex-col gap-2'>
								<span>
									{t(GameKey.YOU_NEED_CREDITS_FOR_MULTIPLAYER, {
										count: requiredCredits,
										questions: questionsCount,
										players: playerCount,
									})}
								</span>
								<Button
									variant={VariantBase.DEFAULT}
									size={ButtonSize.SM}
									className='w-fit'
									onClick={() => navigate(Routes.PAYMENT, { state: { modal: true, returnUrl: Routes.MULTIPLAYER } })}
								>
									{t(GameKey.GET_CREDITS)}
								</Button>
							</AlertDescription>
						</Alert>
					)}
					{/* Action Buttons */}
					<div className='flex gap-4'>
						{isHost && (
							<Button
								className='flex-1'
								size={ButtonSize.LG}
								onClick={startGame}
								disabled={!isReadyToStart || isLoading || !canHostAffordGame}
							>
								{!isLoading ? (
									<>
										<Play className='h-4 w-4 me-2' />
										{t(GameKey.START_GAME)}
									</>
								) : (
									<>
										<Spinner size={ComponentSize.SM} className='me-2' />
										{t(GameKey.STARTING_GAME)}
									</>
								)}
							</Button>
						)}
					</div>
					{!isReadyToStart && isHost && !isLoading && (
						<p className='text-center text-sm text-muted-foreground'>
							{t(GameKey.CLICK_START_WHEN_READY, { min: VALIDATION_COUNT.PLAYERS.MIN })}
						</p>
					)}
				</div>
			</main>
		);
	}

	// No room - show create/join options
	return (
		<main className='view-main animate-fade-in-up-simple'>
			<div className='view-content-2xl-scroll'>
				<div className='text-center flex-shrink-0 mb-4'>
					<h1 className='text-2xl md:text-3xl font-bold mb-1 md:mb-2'>{t(GameKey.MULTIPLAYER)}</h1>
					<p className='text-sm md:text-base text-muted-foreground'>{t(GameKey.MULTIPLAYER_SUBTITLE)}</p>
				</div>

				<GameSettingsFlowIssuesAlert items={lobbyNoRoomBannerIssues} />

				<Tabs
					value={lobbyUiTab}
					onValueChange={value => setLobbyUiTab(value === 'join' ? 'join' : 'create')}
					className='w-full'
				>
					<div className='mb-6 flex w-full min-w-0 flex-row items-center gap-4'>
						<Button
							variant={VariantBase.OUTLINE}
							size={ButtonSize.LG}
							className='shrink-0'
							onClick={() => navigate(Routes.GAME, { replace: true })}
						>
							<ArrowLeft className='me-2 h-4 w-4 rtl:scale-x-[-1]' />
							{t(GameKey.BACK_TO_GAME_TYPE)}
						</Button>
						<div className='min-w-0 flex-1'>
							<TabsBar
								items={[
									{ value: 'create', label: t(GameKey.CREATE_ROOM) },
									{ value: 'join', label: t(GameKey.JOIN_ROOM) },
								]}
								variant={TabsListVariant.COMPACT}
							/>
						</div>
					</div>

					<TabsContent value='create' className='mt-6'>
						<Card>
							<CardHeader className='space-y-3'>
								<div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4'>
									<CardTitle className='flex min-w-0 flex-1 items-center gap-2'>
										<Grid2x2Plus className='h-5 w-5 shrink-0 text-primary' />
										{t(GameKey.CREATE_NEW_ROOM)}
									</CardTitle>
									<div
										className={cn(
											'flex min-w-0 max-w-full shrink-0 flex-col gap-1 self-stretch rounded-lg border px-2.5 py-2 transition-colors sm:max-w-[min(100%,16rem)] sm:self-center',
											gameSettings.isPublicLobby ? 'border-primary/50 bg-primary/5' : 'border-border/60 bg-muted/30'
										)}
									>
										<div className='flex items-center justify-between gap-2'>
											<Label
												htmlFor='public-lobby-create'
												className='cursor-pointer text-xs font-semibold leading-tight text-foreground'
											>
												{t(GameKey.PUBLIC_LOBBY_LIST_HOME_LABEL)}
											</Label>
											<Switch
												id='public-lobby-create'
												className='shrink-0'
												checked={gameSettings.isPublicLobby ?? false}
												onCheckedChange={next => setGameSettings(prev => ({ ...prev, isPublicLobby: next }))}
											/>
										</div>
										<p className='text-[0.7rem] leading-snug text-muted-foreground'>
											{t(GameKey.PUBLIC_LOBBY_LIST_HOME_SUBTITLE)}
										</p>
									</div>
								</div>
								{!isAdmin && (
									<Card className='border border-border bg-muted/50 p-3'>
										<div className='mb-2 flex items-center gap-2 text-sm font-medium text-foreground'>
											<CreditCard className='h-4 w-4 shrink-0 text-muted-foreground' />
											<span>{t(GameKey.CREDIT_COST)}</span>
										</div>
										<p className='text-xs leading-relaxed text-muted-foreground'>
											{t(GameKey.MULTIPLAYER_CREATE_HOST_CHARGE_LEAD)}
										</p>
										<p className='mt-2 text-xs font-medium leading-relaxed text-foreground'>
											{t(GameKey.MULTIPLAYER_CREATE_HOST_CHARGE_TOTALS, {
												questions: createRoomHostCreditPreview.questions,
												minTotal: createRoomHostCreditPreview.minTotal,
												maxTotal: createRoomHostCreditPreview.maxTotal,
												minPlayers: createRoomHostCreditPreview.minPlayers,
												maxPlayers: createRoomHostCreditPreview.maxPlayers,
											})}
										</p>
										<p className='mt-1 text-xs leading-relaxed text-muted-foreground'>
											{t(GameKey.MULTIPLAYER_CREATE_HOST_CHARGE_PER_QUESTION, {
												minPerQuestion: createRoomHostCreditPreview.minPerQuestion,
												maxPerQuestion: createRoomHostCreditPreview.maxPerQuestion,
											})}
										</p>
									</Card>
								)}
								<CardDescription className='text-sm leading-relaxed'>{t(GameKey.SET_UP_GAME_ROOM)}</CardDescription>
							</CardHeader>
							<CardContent className='space-y-6'>
								<GameSettingsForm
									topic={topic}
									onTopicChange={value => {
										handleTopicChange(value);
										setGameSettings(prev => ({ ...prev, topic: value }));
									}}
									topicError={topicError}
									topicLanguageError={topicLanguageError}
									topicLanguageStatus={topicLanguageStatus}
									selectedDifficulty={selectedDifficulty}
									onDifficultyChange={difficulty => {
										setSelectedDifficulty(difficulty);
										setGameSettings(prev => ({ ...prev, difficulty }));
									}}
									customDifficulty={customDifficulty}
									onCustomDifficultyChange={setCustomDifficulty}
									customDifficultyError={customDifficultyError}
									onCustomDifficultyErrorChange={setCustomDifficultyError}
									customDifficultyLanguageError={customDifficultyLanguageError}
									customDifficultyLanguageStatus={customDifficultyLanguageStatus}
									answerCount={answerCount}
									onAnswerCountChange={setAnswerCount}
									maxQuestionsPerGame={gameSettings.questionsPerRequest}
									onMaxQuestionsPerGameChange={value =>
										setGameSettings(prev => ({ ...prev, questionsPerRequest: value }))
									}
									maxPlayers={gameSettings.maxPlayers}
									onMaxPlayersChange={value => setGameSettings(prev => ({ ...prev, maxPlayers: value }))}
									showMaxPlayers={true}
									hideInlineFieldAlerts
								/>

								<Button
									className='w-full'
									size={ButtonSize.LG}
									onClick={handleCreateRoom}
									disabled={
										isLoading ||
										!canSubmitLanguage ||
										topicLanguageStatus === TextLanguageStatus.PENDING ||
										customDifficultyLanguageStatus === TextLanguageStatus.PENDING
									}
								>
									{isLoading && <Spinner size={ComponentSize.SM} className='me-2' />}
									{t(GameKey.CREATE_ROOM)}
								</Button>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value='join' className='mt-6'>
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<Grid2x2Check className='h-5 w-5 text-primary' />
									{t(GameKey.JOIN_ROOM)}
								</CardTitle>
								<CardDescription>{t(GameKey.JOIN_ROOM_DESC)}</CardDescription>
							</CardHeader>
							<CardContent className='space-y-4'>
								<div className='space-y-2'>
									<Label>{t(GameKey.ROOM_CODE_LABEL)}</Label>
									<Input
										id='roomCode'
										value={joinRoomId}
										onChange={e => setJoinRoomId(e.target.value.toUpperCase())}
										placeholder={t(GameKey.ROOM_CODE_PLACEHOLDER)}
										className='text-center text-lg font-mono uppercase'
										maxLength={VALIDATION_LENGTH.ROOM_CODE.LENGTH}
									/>
								</div>

								<Button className='w-full' size={ButtonSize.LG} onClick={handleJoinRoom} disabled={isLoading}>
									{isLoading && <Spinner size={ComponentSize.SM} className='me-2' />}
									{t(GameKey.JOIN_ROOM)}
								</Button>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>
		</main>
	);
}
