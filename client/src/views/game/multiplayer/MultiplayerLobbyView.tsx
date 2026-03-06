import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Copy, Crown, Info, Play, Plus, Users } from 'lucide-react';

import {
	DEFAULT_GAME_CONFIG,
	GAME_MODES_CONFIG,
	GAME_STATE_DEFAULTS,
	GameMode,
	PlayerStatus,
	RoomStatus,
	VALIDATION_COUNT,
	VALIDATION_LENGTH,
} from '@shared/constants';
import type { CreateRoomConfig } from '@shared/types';
import { formatDifficulty, formatTitle } from '@shared/utils';

import {
	AlertVariant,
	AvatarSize,
	ButtonSize,
	Colors,
	ComponentSize,
	VALIDATION_MESSAGES,
	VariantBase,
} from '@/constants';
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
	HomeButton,
	Input,
	Label,
	Spinner,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	UserAvatar,
} from '@/components';
import { GameSettingsForm } from '@/components/game';
import { useGameSettingsForm, useMultiplayer } from '@/hooks';
import { clientLogger as logger } from '@/services';
import { cn, getDisplayNameFromPlayer } from '@/utils';

export function MultiplayerLobbyView() {
	const navigate = useNavigate();

	// Shared game settings form state & validation
	const {
		topic,
		topicError,
		selectedDifficulty,
		customDifficulty,
		customDifficultyError,
		answerCount,
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

	const [joinRoomId, setJoinRoomId] = useState('');

	const [gameSettings, setGameSettings] = useState<CreateRoomConfig>({
		topic: GAME_STATE_DEFAULTS.TOPIC,
		difficulty: selectedDifficulty,
		questionsPerRequest: GAME_MODES_CONFIG[GameMode.MULTIPLAYER].defaults.maxQuestionsPerGame ?? 10,
		maxPlayers: VALIDATION_COUNT.PLAYERS.MAX,
		gameMode: GameMode.QUESTION_LIMITED,
	});

	const handleCreateRoom = async () => {
		const { isValid, finalDifficulty } = validateSettings();
		if (!isValid) return;

		await createRoom({
			...gameSettings,
			topic: topic.trim() || GAME_STATE_DEFAULTS.TOPIC,
			difficulty: finalDifficulty,
			answerCount,
		});
	};

	const handleJoinRoom = async () => {
		if (!joinRoomId.trim()) {
			logger.userError(VALIDATION_MESSAGES.ROOM_CODE_REQUIRED);
			return;
		}
		await joinRoom(joinRoomId.trim());
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
			navigate(`/game/multiplayer/play/${room.roomId}`);
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
						{displayMessage}
					</motion.h2>
					<p className='text-muted-foreground'>Please wait while we establish a connection</p>
				</div>
			</main>
		);
	}

	// If in a room, show the lobby
	if (room) {
		return (
			<main className='view-main animate-fade-in-up-simple'>
				<div className='view-content-2xl-scroll'>
					<div className='text-center flex-shrink-0'>
						<h1 className='text-2xl md:text-3xl font-bold mb-1 md:mb-2'>Multiplayer Lobby</h1>
						{roomCode && (
							<div className='flex items-center justify-center gap-2'>
								<span className='text-muted-foreground'>Room Code:</span>
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
								<Users className='h-5 w-5 text-primary' />
								Players ({room.players?.length ?? 0}/{room.config?.maxPlayers ?? VALIDATION_COUNT.PLAYERS.MAX})
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
										<UserAvatar player={player} size={AvatarSize.MD} />
										<div className='flex-1'>
											<div className='flex items-center gap-2'>
												<span className='font-medium'>{getDisplayNameFromPlayer(player)}</span>
												{player.userId === room.hostId && <Crown className={cn('h-4 w-4', Colors.YELLOW_500.text)} />}
											</div>
										</div>
										<Badge
											variant={
												player.status === PlayerStatus.DISCONNECTED ? VariantBase.SECONDARY : VariantBase.DEFAULT
											}
										>
											{player.status === PlayerStatus.DISCONNECTED ? 'Not Ready' : 'Ready'}
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
								Game Details
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className='grid grid-cols-2 gap-4 text-sm'>
								<div className='flex justify-between'>
									<span className='text-muted-foreground'>Topic:</span>
									<span className='font-medium'>
										{formatTitle(room.config?.topic ?? DEFAULT_GAME_CONFIG.defaultTopic)}
									</span>
								</div>
								<div className='flex justify-between'>
									<span className='text-muted-foreground'>Difficulty:</span>
									<span className='font-medium'>
										{formatDifficulty(room.config?.difficulty ?? DEFAULT_GAME_CONFIG.defaultDifficulty)}
									</span>
								</div>
								<div className='flex justify-between'>
									<span className='text-muted-foreground'>Questions:</span>
									<span className='font-medium'>{room.questions?.length ?? 10}</span>
								</div>
								<div className='flex justify-between'>
									<span className='text-muted-foreground'>Status:</span>
									<Badge variant={VariantBase.OUTLINE} className='capitalize'>
										{room.status}
									</Badge>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Action Buttons */}
					<div className='flex gap-4'>
						{isHost && (
							<Button
								className='flex-1'
								size={ButtonSize.LG}
								onClick={startGame}
								disabled={!isReadyToStart || isLoading}
							>
								{!isLoading ? (
									<>
										<Play className='h-4 w-4 mr-2' />
										Start Game
									</>
								) : (
									<>
										<Spinner size={ComponentSize.SM} className='mr-2' />
										Starting game...
									</>
								)}
							</Button>
						)}
						<Button variant={VariantBase.OUTLINE} size={ButtonSize.LG} onClick={leaveRoom} disabled={isLoading}>
							Leave Lobby
						</Button>
					</div>
					{!isReadyToStart && isHost && !isLoading && (
						<p className='text-center text-sm text-muted-foreground'>
							Click Start when you're ready (at least {VALIDATION_COUNT.PLAYERS.MIN} players).
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
				<div className='text-center flex-shrink-0'>
					<h1 className='text-2xl md:text-3xl font-bold mb-1 md:mb-2'>Multiplayer</h1>
					<p className='text-sm md:text-base text-muted-foreground'>Play trivia with friends in real-time</p>
				</div>

				{error && (
					<Alert variant={AlertVariant.DESTRUCTIVE}>
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				<Tabs defaultValue='create' className='w-full'>
					<TabsList className='grid w-full grid-cols-2'>
						<TabsTrigger value='create'>Create Room</TabsTrigger>
						<TabsTrigger value='join'>Join Room</TabsTrigger>
					</TabsList>

					<TabsContent value='create' className='mt-6'>
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<Plus className='h-5 w-5' />
									Create a New Room
								</CardTitle>
								<CardDescription>Set up a game room and invite friends</CardDescription>
							</CardHeader>
							<CardContent className='space-y-6'>
								<GameSettingsForm
									topic={topic}
									onTopicChange={value => {
										handleTopicChange(value);
										setGameSettings(prev => ({ ...prev, topic: value }));
									}}
									topicError={topicError}
									selectedDifficulty={selectedDifficulty}
									onDifficultyChange={difficulty => {
										setSelectedDifficulty(difficulty);
										setGameSettings(prev => ({ ...prev, difficulty }));
									}}
									customDifficulty={customDifficulty}
									onCustomDifficultyChange={setCustomDifficulty}
									customDifficultyError={customDifficultyError}
									onCustomDifficultyErrorChange={setCustomDifficultyError}
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

								<Button className='w-full' size={ButtonSize.LG} onClick={handleCreateRoom} disabled={isLoading}>
									{isLoading && <Spinner size={ComponentSize.SM} className='mr-2' />}
									Create Room
								</Button>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value='join' className='mt-6'>
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<Users className='h-5 w-5 text-primary' />
									Join a Room
								</CardTitle>
								<CardDescription>Enter the room code shared by your friend</CardDescription>
							</CardHeader>
							<CardContent className='space-y-4'>
								<div className='space-y-2'>
									<Label htmlFor='roomCode'>Room Code</Label>
									<Input
										id='roomCode'
										value={joinRoomId}
										onChange={e => setJoinRoomId(e.target.value.toUpperCase())}
										placeholder='Enter room code...'
										className='text-center text-lg font-mono uppercase'
										maxLength={VALIDATION_LENGTH.ROOM_CODE.LENGTH}
									/>
								</div>

								<Button className='w-full' size={ButtonSize.LG} onClick={handleJoinRoom} disabled={isLoading}>
									{isLoading && <Spinner size={ComponentSize.SM} className='mr-2' />}
									Join Room
								</Button>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>

				<div className='text-center'>
					<HomeButton />
				</div>
			</div>
		</main>
	);
}
