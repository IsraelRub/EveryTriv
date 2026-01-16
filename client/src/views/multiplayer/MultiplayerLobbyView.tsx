import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Copy, Crown, Gamepad2, Info, Plus, Users } from 'lucide-react';

import {
	DifficultyLevel,
	GAME_MODE_DEFAULTS,
	GameMode,
	PlayerStatus,
	RoomStatus,
	VALIDATION_COUNT,
	VALIDATION_LENGTH,
} from '@shared/constants';
import type { CreateRoomConfig, GameDifficulty } from '@shared/types';
import {
	createCustomDifficulty,
	validateCustomDifficultyText,
	validateTopicLength,
	validateTriviaRequest,
} from '@shared/validation';

import {
	ButtonSize,
	ButtonVariant,
	GAME_STATE_DEFAULTS,
	SCORING_DEFAULTS,
	SpinnerSize,
	VALIDATION_MESSAGES,
	VariantBase,
} from '@/constants';
import {
	Alert,
	AlertDescription,
	Avatar,
	AvatarFallback,
	BackToHomeButton,
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
import { useMultiplayer } from '@/hooks';
import { clientLogger as logger } from '@/services';

export function MultiplayerLobbyView() {
	const navigate = useNavigate();

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

	const handleStartGame = () => {
		if (isReadyToStart) {
			startGame();
		}
	};

	const handleLeaveRoom = () => {
		leaveRoom();
	};

	const [joinRoomId, setJoinRoomId] = useState('');
	const [customDifficulty, setCustomDifficulty] = useState('');
	const [customDifficultyError, setCustomDifficultyError] = useState<string>('');
	const [topicError, setTopicError] = useState<string>('');
	const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>(DifficultyLevel.MEDIUM);
	const [answerCount, setAnswerCount] = useState<number>(SCORING_DEFAULTS.ANSWER_COUNT);

	const [gameSettings, setGameSettings] = useState<CreateRoomConfig>({
		topic: GAME_STATE_DEFAULTS.TOPIC,
		difficulty: DifficultyLevel.MEDIUM,
		questionsPerRequest: GAME_MODE_DEFAULTS[GameMode.MULTIPLAYER].maxQuestionsPerGame ?? 10,
		maxPlayers: VALIDATION_COUNT.PLAYERS.MAX,
		gameMode: GameMode.QUESTION_LIMITED,
	});

	const handleCreateRoom = async () => {
		// Format custom difficulty with prefix, or use standard difficulty
		let finalDifficulty: GameDifficulty;
		if (selectedDifficulty === DifficultyLevel.CUSTOM) {
			finalDifficulty = customDifficulty.trim() ? createCustomDifficulty(customDifficulty) : DifficultyLevel.MEDIUM;
		} else {
			finalDifficulty = selectedDifficulty;
		}

		// Validate trivia request if topic is provided (empty topic is allowed for random)
		const trimmedTopic = gameSettings.topic.trim();
		if (trimmedTopic) {
			const triviaValidation = validateTriviaRequest(trimmedTopic, finalDifficulty);
			if (!triviaValidation.isValid) {
				// Set topic error if there are topic-related errors
				const topicErrors = triviaValidation.errors.filter(
					err => err.toLowerCase().includes('topic') || err.toLowerCase().includes('length')
				);
				if (topicErrors.length > 0 && topicErrors[0]) {
					setTopicError(topicErrors[0]);
				}
				// Set custom difficulty error if there are difficulty-related errors
				if (selectedDifficulty === DifficultyLevel.CUSTOM) {
					const difficultyErrors = triviaValidation.errors.filter(
						err => !err.toLowerCase().includes('topic') && !err.toLowerCase().includes('length')
					);
					if (difficultyErrors.length > 0 && difficultyErrors[0]) {
						setCustomDifficultyError(difficultyErrors[0]);
					}
				}
				return;
			}
		}
		setTopicError('');

		// Validate custom difficulty if selected
		if (selectedDifficulty === DifficultyLevel.CUSTOM) {
			const trimmedCustomDifficulty = customDifficulty.trim();
			const validation = validateCustomDifficultyText(trimmedCustomDifficulty);

			if (!validation.isValid) {
				setCustomDifficultyError(validation.errors[0] ?? VALIDATION_MESSAGES.CUSTOM_DIFFICULTY_INVALID);
				return;
			}

			setCustomDifficultyError('');
		}

		await createRoom({
			...gameSettings,
			difficulty: finalDifficulty,
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
			navigate(`/multiplayer/game/${room.roomId}`);
		}
	}, [room?.status, room?.roomId, navigate]);

	if (!isConnected) {
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
										<Avatar>
											<AvatarFallback>{player.displayName?.charAt(0) ?? 'P'}</AvatarFallback>
										</Avatar>
										<div className='flex-1'>
											<div className='flex items-center gap-2'>
												<span className='font-medium'>{player.displayName ?? 'Player'}</span>
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
									<span className='font-medium'>{room.config?.topic ?? 'General'}</span>
								</div>
								<div className='flex justify-between'>
									<span className='text-muted-foreground'>Difficulty:</span>
									<span className='font-medium capitalize'>{room.config?.difficulty ?? 'Medium'}</span>
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
								onClick={handleStartGame}
								disabled={!isReadyToStart || isLoading}
							>
								{isLoading ? (
									<Spinner size={SpinnerSize.SM} variant='loader' className='mr-2' />
								) : (
									<Gamepad2 className='h-4 w-4 mr-2' />
								)}
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
									onTopicChange={topic => {
										setGameSettings(prev => ({ ...prev, topic }));
										// Validate topic in real-time if not empty
										if (topic.trim()) {
											const topicValidation = validateTopicLength(topic.trim());
											setTopicError(topicValidation.isValid ? '' : (topicValidation.errors[0] ?? ''));
										} else {
											setTopicError('');
										}
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
									{isLoading ? <Spinner size={SpinnerSize.SM} variant='loader' className='mr-2' /> : null}
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
									{isLoading ? <Spinner size={SpinnerSize.SM} variant='loader' className='mr-2' /> : null}
									Join Room
								</Button>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>

				<div className='text-center'>
					<BackToHomeButton variant={ButtonVariant.GHOST} />
				</div>
			</div>
		</motion.main>
	);
}
