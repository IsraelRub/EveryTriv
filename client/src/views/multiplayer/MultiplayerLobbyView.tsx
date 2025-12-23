import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { motion } from 'framer-motion';
import { AlertCircle, Copy, Crown, FileQuestion, Gamepad2, Hash, Loader2, Plus, Settings, Users } from 'lucide-react';

import { DifficultyLevel, GAME_STATE_CONFIG, GameMode, MULTIPLAYER_CONFIG, PlayerStatus } from '@shared/constants';
import type { CreateRoomConfig } from '@shared/types';

import { ButtonSize, ButtonVariant, ROUTES, ToastVariant, VariantBase } from '@/constants';

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
	NumberInput,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '@/components';

import { useMultiplayerRoom, useToast } from '@/hooks';

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
	} = useMultiplayerRoom();

	const [joinRoomId, setJoinRoomId] = useState('');
	const [gameSettings, setGameSettings] = useState<CreateRoomConfig>({
		topic: GAME_STATE_CONFIG.defaults.topic,
		difficulty: DifficultyLevel.MEDIUM,
		questionsPerRequest: MULTIPLAYER_CONFIG.DEFAULT_QUESTIONS_PER_REQUEST,
		maxPlayers: MULTIPLAYER_CONFIG.DEFAULT_MAX_PLAYERS,
		gameMode: GameMode.QUESTION_LIMITED,
	});

	const handleCreateRoom = async () => {
		await createRoom(gameSettings);
	};

	const handleJoinRoom = async () => {
		if (!joinRoomId.trim()) {
			toast({
				title: 'Error',
				description: 'Please enter a room code',
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

	if (!isConnected) {
		return (
			<motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='min-h-screen py-12 px-4'>
				<div className='max-w-md mx-auto text-center space-y-4'>
					<Loader2 className='h-12 w-12 animate-spin mx-auto text-primary' />
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
								Players ({room.players?.length ?? 0}/{room.config?.maxPlayers || MULTIPLAYER_CONFIG.DEFAULT_MAX_PLAYERS}
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

					{/* Game Settings Card */}
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<Settings className='h-5 w-5' />
								Game Settings
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
								{isLoading ? <Loader2 className='h-4 w-4 animate-spin mr-2' /> : <Gamepad2 className='h-4 w-4 mr-2' />}
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
								{/* Topic */}
								<div className='space-y-2'>
									<Label htmlFor='topic' className='flex items-center gap-2'>
										<Hash className='h-4 w-4 text-muted-foreground' />
										Topic
									</Label>
									<Input
										id='topic'
										value={gameSettings.topic}
										onChange={e => setGameSettings(prev => ({ ...prev, topic: e.target.value }))}
										placeholder='Enter a topic...'
									/>
								</div>

								{/* Settings Grid */}
								<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
									{/* Difficulty */}
									<div className='space-y-2'>
										<Label className='flex items-center gap-2'>
											<AlertCircle className='h-4 w-4 text-muted-foreground' />
											Difficulty
										</Label>
										<div className='grid grid-cols-3 gap-2'>
											<Button
												type='button'
												variant={
													gameSettings.difficulty === DifficultyLevel.EASY
														? ButtonVariant.DEFAULT
														: ButtonVariant.OUTLINE
												}
												size={ButtonSize.SM}
												onClick={() => setGameSettings(prev => ({ ...prev, difficulty: DifficultyLevel.EASY }))}
												className='flex items-center justify-center gap-1'
											>
												<span className='w-2 h-2 rounded-full bg-green-500' />
												Easy
											</Button>
											<Button
												type='button'
												variant={
													gameSettings.difficulty === DifficultyLevel.MEDIUM
														? ButtonVariant.DEFAULT
														: ButtonVariant.OUTLINE
												}
												size={ButtonSize.SM}
												onClick={() => setGameSettings(prev => ({ ...prev, difficulty: DifficultyLevel.MEDIUM }))}
												className='flex items-center justify-center gap-1'
											>
												<span className='w-2 h-2 rounded-full bg-yellow-500' />
												Medium
											</Button>
											<Button
												type='button'
												variant={
													gameSettings.difficulty === DifficultyLevel.HARD
														? ButtonVariant.DEFAULT
														: ButtonVariant.OUTLINE
												}
												size={ButtonSize.SM}
												onClick={() => setGameSettings(prev => ({ ...prev, difficulty: DifficultyLevel.HARD }))}
												className='flex items-center justify-center gap-1'
											>
												<span className='w-2 h-2 rounded-full bg-red-500' />
												Hard
											</Button>
										</div>
									</div>

									{/* Questions */}
									<div className='space-y-2'>
										<Label className='flex items-center gap-2'>
											<FileQuestion className='h-4 w-4 text-muted-foreground' />
											Questions
										</Label>
										<div className='flex justify-start'>
											<NumberInput
												value={gameSettings.questionsPerRequest}
												onChange={value => setGameSettings(prev => ({ ...prev, questionsPerRequest: value }))}
												min={5}
												max={20}
												step={5}
											/>
										</div>
									</div>

									{/* Max Players */}
									<div className='space-y-2'>
										<Label className='flex items-center gap-2'>
											<Users className='h-4 w-4 text-muted-foreground' />
											Max Players
										</Label>
										<div className='flex justify-start'>
											<NumberInput
												value={gameSettings.maxPlayers}
												onChange={value => setGameSettings(prev => ({ ...prev, maxPlayers: value }))}
												min={MULTIPLAYER_CONFIG.MIN_PLAYERS}
												max={MULTIPLAYER_CONFIG.MAX_PLAYERS}
												step={1}
											/>
										</div>
									</div>
								</div>

								<Button className='w-full' size={ButtonSize.LG} onClick={handleCreateRoom} disabled={isLoading}>
									{isLoading ? <Loader2 className='h-4 w-4 animate-spin mr-2' /> : null}
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
										maxLength={6}
									/>
								</div>

								<Button className='w-full' size={ButtonSize.LG} onClick={handleJoinRoom} disabled={isLoading}>
									{isLoading ? <Loader2 className='h-4 w-4 animate-spin mr-2' /> : null}
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
