import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Copy, Crown, Gamepad2, Info, Plus, Users } from 'lucide-react';

import {
	CUSTOM_DIFFICULTY_PREFIX,
	DifficultyLevel,
	GAME_MODE_DEFAULTS,
	GAME_STATE_CONFIG,
	GameMode,
	PlayerStatus,
	RoomStatus,
	VALIDATION_LENGTH,
	VALIDATION_COUNT,
} from '@shared/constants';
import type { CreateRoomConfig, GameDifficulty } from '@shared/types';
import { validateCustomDifficultyText } from '@shared/validation';
import { ButtonSize, ButtonVariant, ROUTES, SCORING_DEFAULTS, SpinnerSize, SpinnerVariant, ToastVariant, VALIDATION_MESSAGES, VariantBase } from '@/constants';
import {
	Alert,
	AlertDescription,
	Avatar,
	AvatarFallback,
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Input,
	Label,
	Spinner,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '@/components';
import { GameSettingsForm } from '@/components/game';
import { useMultiplayer, useToast } from '@/hooks';

export function MultiplayerLobbyView() {
	const navigate = useNavigate();
	const { toast } = useToast();

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
	} = useMultiplayer();

	const [joinRoomId, setJoinRoomId] = useState('');
	const [customDifficulty, setCustomDifficulty] = useState('');
	const [customDifficultyError, setCustomDifficultyError] = useState<string>('');
	const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>(DifficultyLevel.MEDIUM);
	const [answerCount, setAnswerCount] = useState<number>(SCORING_DEFAULTS.ANSWER_COUNT);

	const [gameSettings, setGameSettings] = useState<CreateRoomConfig>({
		topic: GAME_STATE_CONFIG.defaults.topic,
		difficulty: DifficultyLevel.MEDIUM,
		questionsPerRequest: GAME_MODE_DEFAULTS[GameMode.MULTIPLAYER].maxQuestionsPerGame ?? 10,
		maxPlayers: VALIDATION_COUNT.PLAYERS.MAX,
		gameMode: GameMode.QUESTION_LIMITED,
	});

	const handleCreateRoom = async () => {
		// Validate custom difficulty if selected
		if (selectedDifficulty === DifficultyLevel.CUSTOM) {
			const trimmedCustomDifficulty = customDifficulty.trim();
			const validation = validateCustomDifficultyText(trimmedCustomDifficulty);

			if (!validation.isValid) {
				setCustomDifficultyError(validation.errors[0] || VALIDATION_MESSAGES.CUSTOM_DIFFICULTY_INVALID);
				return;
			}

			setCustomDifficultyError('');
		}

		// Format custom difficulty with prefix, or use standard difficulty
		let finalDifficulty: GameDifficulty;
		if (selectedDifficulty === DifficultyLevel.CUSTOM) {
			finalDifficulty = customDifficulty.trim()
				? `${CUSTOM_DIFFICULTY_PREFIX}${customDifficulty.trim()}`
				: DifficultyLevel.MEDIUM;
		} else {
			finalDifficulty = selectedDifficulty;
		}

		await createRoom({
			...gameSettings,
			difficulty: finalDifficulty,
		});
	};

	const handleJoinRoom = async () => {
		if (!joinRoomId.trim()) {
			toast({
				title: 'Error',
				description: VALIDATION_MESSAGES.ROOM_CODE_REQUIRED,
				variant: ToastVariant.DESTRUCTIVE,
			});
			return;
		}
		await joinRoom(joinRoomId.trim());
	};

	const handleLeaveRoom = () => {
		leaveRoom();
	};

	const handleStartGame = () => {
		if (room?.roomId) {
			startGame();
			navigate(`/multiplayer/game/${room.roomId}`);
		}
	};

	const copyRoomCode = () => {
		if (roomCode) {
			navigator.clipboard.writeText(roomCode);
			toast({
				title: 'Copied!',
				description: 'Room code copied to clipboard',
			});
		}
	};

	useEffect(() => {
		if (error) {
			toast({
				title: 'Error',
				description: error,
				variant: ToastVariant.DESTRUCTIVE,
			});
		}
	}, [error, toast]);

	// Navigate to game view if game has started
	useEffect(() => {
		if (room?.status === RoomStatus.PLAYING && room.roomId) {
			navigate(`/multiplayer/game/${room.roomId}`);
		}
	}, [room?.status, room?.roomId, navigate]);

	if (!isConnected) {
		return (
			<motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='min-h-screen py-12 px-4'>
				<div className='max-w-md mx-auto text-center space-y-4'>
					<Spinner variant={SpinnerVariant.BUTTON} size={SpinnerSize.XL} className='mx-auto text-primary' />
					<h2 className='text-xl font-semibold'>Connecting to multiplayer server...</h2>
					<p className='text-muted-foreground'>Please wait while we establish a connection</p>
				</div>
			</motion.main>
		);
	}

	// If in a room, show the lobby
	if (room) {
		return (
			<motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='min-h-screen py-12 px-4'>
				<div className='max-w-2xl mx-auto space-y-6'>
					<div className='text-center'>
						<h1 className='text-3xl font-bold mb-2'>Multiplayer Lobby</h1>
						{roomCode && (
							<div className='flex items-center justify-center gap-2'>
								<span className='text-muted-foreground'>Room Code:</span>
								<Badge variant={VariantBase.OUTLINE} className='text-lg font-mono px-3 py-1'>
									{roomCode}
								</Badge>
								<Button variant={ButtonVariant.GHOST} size={ButtonSize.ICON} onClick={copyRoomCode}>
									<Copy className='h-4 w-4' />
								</Button>
							</div>
						)}
					</div>

					{error && (
						<Alert variant={VariantBase.DESTRUCTIVE}>
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}

					{/* Players Card */}
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<Users className='h-5 w-5' />
								Players ({room.players?.length ?? 0}/{room.config?.maxPlayers || VALIDATION_COUNT.PLAYERS.MAX}
								)
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
										<Avatar>
											<AvatarFallback>{player.displayName?.charAt(0) || 'P'}</AvatarFallback>
										</Avatar>
										<div className='flex-1'>
											<div className='flex items-center gap-2'>
												<span className='font-medium'>{player.displayName || 'Player'}</span>
												{player.userId === room.hostId && <Crown className='h-4 w-4 text-yellow-500' />}
											</div>
										</div>
										<Badge variant={player.status === PlayerStatus.READY ? VariantBase.DEFAULT : VariantBase.SECONDARY}>
											{player.status === PlayerStatus.READY ? 'Ready' : 'Not Ready'}
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
								<Info className='h-5 w-5' />
							Game Details
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className='grid grid-cols-2 gap-4 text-sm'>
								<div className='flex justify-between'>
									<span className='text-muted-foreground'>Topic:</span>
									<span className='font-medium'>{room.config?.topic || 'General'}</span>
								</div>
								<div className='flex justify-between'>
									<span className='text-muted-foreground'>Difficulty:</span>
									<span className='font-medium capitalize'>{room.config?.difficulty || 'Medium'}</span>
								</div>
								<div className='flex justify-between'>
									<span className='text-muted-foreground'>Questions:</span>
									<span className='font-medium'>{room.questions?.length || 10}</span>
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
								onClick={handleStartGame}
								disabled={!isReadyToStart || isLoading}
							>
								{isLoading ? <Spinner variant={SpinnerVariant.BUTTON} size={SpinnerSize.SM} className='mr-2' /> : <Gamepad2 className='h-4 w-4 mr-2' />}
								Start Game
							</Button>
						)}
						<Button variant={ButtonVariant.OUTLINE} size={ButtonSize.LG} onClick={handleLeaveRoom} disabled={isLoading}>
							Leave Lobby
						</Button>
					</div>

					{!isReadyToStart && isHost && (
						<p className='text-center text-sm text-muted-foreground'>
							Waiting for at least 2 players to start the game...
						</p>
					)}
				</div>
			</motion.main>
		);
	}

	// No room - show create/join options
	return (
		<motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='min-h-screen py-12 px-4'>
			<div className='max-w-2xl mx-auto space-y-6'>
				<div className='text-center'>
					<h1 className='text-3xl font-bold mb-2'>Multiplayer</h1>
					<p className='text-muted-foreground'>Play trivia with friends in real-time</p>
				</div>

				{error && (
					<Alert variant={VariantBase.DESTRUCTIVE}>
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
									topic={gameSettings.topic}
									onTopicChange={topic => setGameSettings(prev => ({ ...prev, topic }))}
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
									{isLoading ? <Spinner variant={SpinnerVariant.BUTTON} size={SpinnerSize.SM} className='mr-2' /> : null}
									Create Room
								</Button>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value='join' className='mt-6'>
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<Users className='h-5 w-5' />
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
									{isLoading ? <Spinner variant={SpinnerVariant.BUTTON} size={SpinnerSize.SM} className='mr-2' /> : null}
									Join Room
								</Button>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>

				<div className='text-center'>
					<Button variant={ButtonVariant.GHOST} onClick={() => navigate(ROUTES.HOME)}>
						Back to Home
					</Button>
				</div>
			</div>
		</motion.main>
	);
}
