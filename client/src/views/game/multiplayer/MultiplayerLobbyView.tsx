import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Copy, Crown, Grid2x2Check, Grid2x2Plus, Info, Play } from 'lucide-react';

import {
	DEFAULT_GAME_CONFIG,
	GAME_MODES_CONFIG,
	GameMode,
	PlayerStatus,
	RoomStatus,
	VALIDATION_COUNT,
	VALIDATION_LENGTH,
} from '@shared/constants';
import type { CreateRoomConfig } from '@shared/types';
import { formatTitle, getDisplayNameFromUserFields } from '@shared/utils';

import {
	AlertVariant,
	AvatarSize,
	ButtonSize,
	Colors,
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
import { cn, getDifficultyDisplayLabel } from '@/utils';
import {
	Alert,
	AlertDescription,
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	ExitGameButton,
	Input,
	Label,
	Spinner,
	Tabs,
	TabsContent,
	UserAvatar,
} from '@/components';
import { GameSettingsForm } from '@/components/game';
import { TabsBar } from '@/components/layout';
import { useCanPlay, useGameSettingsForm, useMultiplayer, useUserRole } from '@/hooks';

const ROOM_STATUS_KEYS: Record<RoomStatus, string> = {
	[RoomStatus.WAITING]: GameKey.ROOM_STATUS_WAITING,
	[RoomStatus.STARTING]: GameKey.ROOM_STATUS_STARTING,
	[RoomStatus.PLAYING]: GameKey.ROOM_STATUS_PLAYING,
	[RoomStatus.FINISHED]: GameKey.ROOM_STATUS_FINISHED,
	[RoomStatus.CANCELLED]: GameKey.ROOM_STATUS_CANCELLED,
};

export function MultiplayerLobbyView() {
	const { t } = useTranslation(['game', 'loading']);
	const navigate = useNavigate();

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

	const [gameSettings, setGameSettings] = useState<CreateRoomConfig>({
		topic: DEFAULT_GAME_CONFIG.defaultTopic,
		difficulty: selectedDifficulty,
		questionsPerRequest: GAME_MODES_CONFIG[GameMode.MULTIPLAYER].defaults.maxQuestionsPerGame ?? 10,
		maxPlayers: VALIDATION_COUNT.PLAYERS.DEFAULT,
	});

	const handleCreateRoom = async () => {
		const { isValid, finalDifficulty } = validateSettings();
		if (!isValid) return;
		if (!canSubmitLanguage) return;

		await createRoom({
			...gameSettings,
			topic: topic.trim() || DEFAULT_GAME_CONFIG.defaultTopic,
			difficulty: finalDifficulty,
			answerCount,
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

	const copyRoomCode = () => {
		if (roomCode) {
			navigator.clipboard.writeText(roomCode);
			logger.userSuccess('Room code copied to clipboard', { roomCode });
		}
	};

	useEffect(() => {
		if (error) {
			logger.userError(error);
		}
	}, [error]);

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
					<div className='flex-shrink-0 mb-4'>
						<ExitGameButton
							variant={ExitGameButtonVariant.ROOM}
							onConfirm={leaveRoom}
							size={ButtonSize.LG}
							disabled={isLoading}
						/>
					</div>
					<div className='text-center flex-shrink-0'>
						<h1 className='text-2xl md:text-3xl font-bold mb-1 md:mb-2'>{t(GameKey.MULTIPLAYER_LOBBY)}</h1>
						{roomCode && (
							<div className='flex items-center justify-center gap-2'>
								<span className='text-muted-foreground'>{t(GameKey.ROOM_CODE)}</span>
								<Badge variant={VariantBase.OUTLINE} className='text-lg font-mono px-3 py-1'>
									{roomCode}
								</Badge>
								<Button variant={VariantBase.MINIMAL} size={ButtonSize.ICON_LG} onClick={copyRoomCode}>
									<Copy className='h-4 w-4' />
								</Button>
							</div>
						)}
					</div>

					{error && (
						<Alert variant={AlertVariant.DESTRUCTIVE}>
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}

					{/* Players Card */}
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<Grid2x2Check className='h-5 w-5 text-primary' />
								{t(GameKey.PLAYERS)} ({room.players?.length ?? 0}/
								{room.config?.maxPlayers ?? VALIDATION_COUNT.PLAYERS.MAX})
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className='space-y-3'>
								{room.players?.map(player => (
									<motion.div
										key={player.userId}
										initial={{ opacity: 0, x: -10 }}
										animate={{ opacity: 1, x: 0 }}
										className='flex items-center gap-3 p-3 rounded-lg bg-muted/50'
									>
										<UserAvatar source={player} size={AvatarSize.MD} />
										<div className='flex-1'>
											<div className='flex items-center gap-2'>
												<span className='font-medium'>{getDisplayNameFromUserFields(player)}</span>
												{player.userId === room.hostId && <Crown className={cn('h-4 w-4', Colors.YELLOW_500.text)} />}
											</div>
										</div>
										<Badge
											variant={
												player.status === PlayerStatus.DISCONNECTED ? VariantBase.SECONDARY : VariantBase.DEFAULT
											}
										>
											{player.status === PlayerStatus.DISCONNECTED ? t(GameKey.NOT_READY) : t(GameKey.READY)}
										</Badge>
									</motion.div>
								))}
							</div>
						</CardContent>
					</Card>

					{/* Game Details Card */}
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<Info className='h-5 w-5 text-primary' />
								{t(GameKey.GAME_DETAILS)}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className='grid grid-cols-2 gap-4 text-sm'>
								<div className='flex justify-between'>
									<span className='text-muted-foreground'>{t(GameKey.TOPIC_LABEL)}:</span>
									<span className='font-medium'>
										{formatTitle(room.config?.topic ?? DEFAULT_GAME_CONFIG.defaultTopic)}
									</span>
								</div>
								<div className='flex justify-between'>
									<span className='text-muted-foreground'>{t(GameKey.DIFFICULTY_LABEL)}:</span>
									<span className='font-medium'>{getDifficultyDisplayLabel(room.config?.difficulty, t)}</span>
								</div>
								<div className='flex justify-between'>
									<span className='text-muted-foreground'>{t(GameKey.QUESTIONS_LABEL)}:</span>
									<span className='font-medium'>{questionsCount}</span>
								</div>
								<div className='flex justify-between items-center'>
									<span className='text-muted-foreground'>{t(GameKey.STATUS_LABEL)}:</span>
									<Badge variant={VariantBase.OUTLINE} className='inline-flex items-center gap-1.5'>
										{room.status === RoomStatus.STARTING && <Spinner size={ComponentSize.SM} className='shrink-0' />}
										{t(ROOM_STATUS_KEYS[room.status] ?? GameKey.ROOM_STATUS_WAITING)}
									</Badge>
								</div>
							</div>
						</CardContent>
					</Card>

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
				<div className='flex-shrink-0 mb-4 flex justify-center'>
					<Button
						variant={VariantBase.OUTLINE}
						size={ButtonSize.LG}
						onClick={() => navigate(ROUTES.GAME, { replace: true })}
					>
						<ArrowLeft className='h-4 w-4 me-2 rtl:scale-x-[-1]' />
						{t(GameKey.BACK_TO_GAME_TYPE)}
					</Button>
				</div>
				<div className='text-center flex-shrink-0'>
					<h1 className='text-2xl md:text-3xl font-bold mb-1 md:mb-2'>{t(GameKey.MULTIPLAYER)}</h1>
					<p className='text-sm md:text-base text-muted-foreground'>{t(GameKey.MULTIPLAYER_SUBTITLE)}</p>
				</div>

				{error && (
					<Alert variant={AlertVariant.DESTRUCTIVE}>
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				<Tabs defaultValue='create' className='w-full'>
					<TabsBar
						items={[
							{ value: 'create', label: t(GameKey.CREATE_ROOM) },
							{ value: 'join', label: t(GameKey.JOIN_ROOM) },
						]}
						variant={TabsListVariant.COMPACT}
					/>

					<TabsContent value='create' className='mt-6'>
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<Grid2x2Plus className='h-5 w-5 text-primary' />
									{t(GameKey.CREATE_NEW_ROOM)}
								</CardTitle>
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
									<Label htmlFor='roomCode'>{t(GameKey.ROOM_CODE_LABEL)}</Label>
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
