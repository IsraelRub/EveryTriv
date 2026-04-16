import { useEffect, useMemo, useState } from 'react';
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

import {
	AlertVariant,
	ButtonSize,
	ComponentSize,
	ExitGameButtonVariant,
	GameKey,
	ROUTES,
	TabsListVariant,
	TextLanguageStatus,
	VALIDATION_MESSAGES,
	VariantBase,
} from '@/constants';
import { clientLogger as logger } from '@/services';
import { toLobbyPlayerRowsFromMultiplayerRoom } from '@/utils';
import {
	Alert,
	AlertDescription,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Checkbox,
	ExitGameButton,
	Input,
	Label,
	LobbyGameDetailsCard,
	LobbyPlayersCard,
	LobbyRoomCodeBlock,
	Spinner,
	Tabs,
	TabsContent,
} from '@/components';
import { GameSettingsForm } from '@/components/game';
import { TabsBar } from '@/components/layout';
import { useAppSelector, useCanPlay, useCopyRoomCode, useGameSettingsForm, useMultiplayer, useUserRole } from '@/hooks';
import { selectLocale } from '@/redux/selectors';

export function MultiplayerLobbyView() {
	const { t } = useTranslation(['game', 'loading']);
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

	const { copied: roomCodeCopied, copy: copyRoomCode } = useCopyRoomCode(roomCode);

	const lobbyPlayerRows = useMemo(() => (room ? toLobbyPlayerRowsFromMultiplayerRoom(room) : []), [room]);

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
		const { isValid, finalDifficulty } = validateSettings();
		if (!isValid) return;
		if (!canSubmitLanguage) return;

		await createRoom({
			...gameSettings,
			topic: topic.trim() || DEFAULT_GAME_CONFIG.defaultTopic,
			difficulty: finalDifficulty,
			answerCount,
			outputLanguage,
			isPublicLobby: gameSettings.isPublicLobby === true,
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
		const params = new URLSearchParams(location.search);
		const join = params.get('join');
		if (!join || join.length !== VALIDATION_LENGTH.ROOM_CODE.LENGTH) {
			return;
		}
		setJoinRoomId(join.toUpperCase());
		setLobbyUiTab('join');
		params.delete('join');
		const qs = params.toString();
		navigate({ pathname: ROUTES.MULTIPLAYER, search: qs ? `?${qs}` : '' }, { replace: true });
	}, [location.search, navigate]);

	// Navigate to game view if game has started
	useEffect(() => {
		if (room?.status === RoomStatus.PLAYING && room.roomId) {
			navigate(ROUTES.MULTIPLAYER_PLAY.replace(':roomId', room.roomId));
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
						<Card>
							<CardHeader>
								<CardTitle className='text-base'>{t(GameKey.PUBLIC_LOBBY_LIST_HOME_LABEL)}</CardTitle>
								<CardDescription>{t(GameKey.PUBLIC_LOBBY_LIST_HOME_DESCRIPTION)}</CardDescription>
							</CardHeader>
							<CardContent>
								<div className='flex items-start gap-3'>
									<Checkbox
										id='public-lobby-host'
										checked={room.isPublicLobby === true}
										onCheckedChange={checked => updatePublicLobbyVisibility(checked === true)}
										className='mt-1'
									/>
									<Label htmlFor='public-lobby-host' className='cursor-pointer font-medium leading-snug'>
										{t(GameKey.PUBLIC_LOBBY_LIST_HOME_LABEL)}
									</Label>
								</div>
							</CardContent>
						</Card>
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
									onClick={() => navigate(ROUTES.PAYMENT, { state: { modal: true, returnUrl: ROUTES.MULTIPLAYER } })}
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

				{error && (
					<Alert variant={AlertVariant.DESTRUCTIVE}>
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

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
							onClick={() => navigate(ROUTES.GAME, { replace: true })}
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
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<Grid2x2Plus className='h-5 w-5 text-primary' />
									{t(GameKey.CREATE_NEW_ROOM)}
								</CardTitle>
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
								<CardDescription>{t(GameKey.SET_UP_GAME_ROOM)}</CardDescription>
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
								/>

								<div className='flex items-start gap-3 rounded-lg border border-border/60 bg-muted/30 p-4'>
									<Checkbox
										id='public-lobby-create'
										checked={gameSettings.isPublicLobby === true}
										onCheckedChange={checked => setGameSettings(prev => ({ ...prev, isPublicLobby: checked === true }))}
										className='mt-1'
									/>
									<div className='min-w-0 space-y-1'>
										<Label htmlFor='public-lobby-create' className='cursor-pointer text-base font-medium'>
											{t(GameKey.PUBLIC_LOBBY_LIST_HOME_LABEL)}
										</Label>
										<p className='text-sm text-muted-foreground'>{t(GameKey.PUBLIC_LOBBY_LIST_HOME_DESCRIPTION)}</p>
									</div>
								</div>

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
