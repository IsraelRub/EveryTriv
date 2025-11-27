/**
 * Multiplayer Lobby View
 *
 * @module MultiplayerLobbyView
 * @description Lobby view for creating or joining multiplayer rooms
 * @used_by client/src/AppRoutes.tsx
 */
import { useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { motion } from 'framer-motion';

import { DifficultyLevel, GameMode, VALID_DIFFICULTIES } from '@shared/constants';
import { clientLogger as logger } from '@shared/services';
import type { GameDifficulty } from '@shared/types';

import { Button, Card, CardContent, CardHeader, CardTitle, Container, fadeInUp, PlayerList } from '../../components';
import { Input } from '../../components/ui';
import { ButtonVariant, CardVariant, ComponentSize, ContainerSize } from '../../constants';
import { useMultiplayerRoom, useUserProfile } from '../../hooks';

export default function MultiplayerLobbyView() {
	const navigate = useNavigate();
	const { room, isConnected, isHost, isReadyToStart, createRoom, joinRoom, startGame, error, roomCode } =
		useMultiplayerRoom();
	const { data: userProfile } = useUserProfile();

	const [roomId, setRoomId] = useState('');
	const [showCreateForm, setShowCreateForm] = useState(!room);
	const [topic, setTopic] = useState('');
	const [difficulty, setDifficulty] = useState<GameDifficulty>(DifficultyLevel.MEDIUM);
	const [requestedQuestions, setRequestedQuestions] = useState(10);
	const [maxPlayers, setMaxPlayers] = useState(4);
	const [gameMode, setGameMode] = useState<GameMode>(GameMode.QUESTION_LIMITED);

	const handleCreateRoom = async () => {
		if (!topic || !difficulty) {
			logger.gameError('Missing required fields for room creation');
			return;
		}

		await createRoom({
			topic,
			difficulty,
			requestedQuestions,
			maxPlayers,
			gameMode,
		});
		setShowCreateForm(false);
	};

	const handleJoinRoom = async () => {
		if (!roomId.trim()) {
			logger.gameError('Room ID is required');
			return;
		}

		await joinRoom(roomId.trim());
	};

	const handleStartGame = () => {
		if (room?.roomId) {
			startGame();
			navigate(`/multiplayer/game/${room.roomId}`);
		}
	};

	if (room) {
		return (
			<Container size={ContainerSize.LG} className='py-8'>
				<motion.div variants={fadeInUp} initial='hidden' animate='visible' className='space-y-6'>
					<Card>
						<CardHeader>
							<CardTitle>
								Room: {roomCode || room.roomId.substring(0, 8).toUpperCase()}
								{roomCode && <span className='ml-2 text-sm text-gray-400 font-normal'>(Code: {roomCode})</span>}
							</CardTitle>
						</CardHeader>
						<CardContent className='space-y-6'>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
								<PlayerList players={room.players} currentUserId={userProfile?.profile?.id} className='col-span-1' />
								<div className='col-span-1'>
									<Card variant={CardVariant.TRANSPARENT}>
										<CardContent className='p-4'>
											<h4 className='font-semibold text-white mb-2'>Room Settings</h4>
											<div className='space-y-2 text-sm text-gray-400'>
												<div>Topic: {room.config.topic}</div>
												<div>Difficulty: {room.config.difficulty}</div>
												<div>Questions: {room.config.requestedQuestions}</div>
												<div>Max Players: {room.config.maxPlayers}</div>
												<div>Game Mode: {room.config.gameMode}</div>
											</div>
										</CardContent>
									</Card>
								</div>
							</div>

							{error && (
								<div className='bg-red-500/20 border border-red-500 text-red-200 px-4 py-2 rounded'>{error}</div>
							)}

							{isHost && isReadyToStart && (
								<Button
									variant={ButtonVariant.PRIMARY}
									size={ComponentSize.LG}
									onClick={handleStartGame}
									className='w-full'
								>
									Start Game
								</Button>
							)}

							{!isReadyToStart && (
								<div className='text-center text-gray-400'>
									Waiting for more players... ({room.players.length}/{room.config.maxPlayers})
								</div>
							)}
						</CardContent>
					</Card>
				</motion.div>
			</Container>
		);
	}

	return (
		<Container size={ContainerSize.LG} className='py-8'>
			<motion.div variants={fadeInUp} initial='hidden' animate='visible' className='space-y-6'>
				<Card>
					<CardHeader>
						<CardTitle>Multiplayer Lobby</CardTitle>
					</CardHeader>
					<CardContent className='space-y-6'>
						{showCreateForm ? (
							<div className='space-y-4'>
								<h3 className='text-xl font-semibold text-white'>Create Room</h3>
								<div>
									<label className='block text-sm font-medium text-gray-300 mb-2'>Topic</label>
									<Input
										value={topic}
										onChange={(e: ChangeEvent<HTMLInputElement>) => setTopic(e.target.value)}
										placeholder='Enter topic (e.g., Science, History)'
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-300 mb-2'>Difficulty</label>
									<select
										value={difficulty}
										onChange={e => setDifficulty(e.target.value as GameDifficulty)}
										className='w-full px-4 py-2 bg-slate-800 text-white rounded-lg border border-slate-700'
									>
										{VALID_DIFFICULTIES.map(d => (
											<option key={d} value={d}>
												{d}
											</option>
										))}
									</select>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-300 mb-2'>Number of Questions</label>
									<Input
										type='number'
										value={requestedQuestions.toString()}
										onChange={(e: ChangeEvent<HTMLInputElement>) =>
											setRequestedQuestions(parseInt(e.target.value) || 10)
										}
										min={1}
										max={50}
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-300 mb-2'>Max Players (2-4)</label>
									<Input
										type='number'
										value={maxPlayers.toString()}
										onChange={(e: ChangeEvent<HTMLInputElement>) => setMaxPlayers(parseInt(e.target.value) || 4)}
										min={2}
										max={4}
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-300 mb-2'>Game Mode</label>
									<select
										value={gameMode}
										onChange={e => setGameMode(e.target.value as GameMode)}
										className='w-full px-4 py-2 bg-slate-800 text-white rounded-lg border border-slate-700'
									>
										<option value={GameMode.QUESTION_LIMITED}>Question Limited</option>
										<option value={GameMode.TIME_LIMITED}>Time Limited</option>
										<option value={GameMode.UNLIMITED}>Unlimited</option>
									</select>
								</div>
								<Button
									variant={ButtonVariant.PRIMARY}
									size={ComponentSize.LG}
									onClick={handleCreateRoom}
									className='w-full'
									disabled={!topic || !isConnected}
								>
									Create Room
								</Button>
								<Button
									variant={ButtonVariant.SECONDARY}
									size={ComponentSize.MD}
									onClick={() => setShowCreateForm(false)}
									className='w-full'
								>
									Join Room Instead
								</Button>
							</div>
						) : (
							<div className='space-y-4'>
								<h3 className='text-xl font-semibold text-white'>Join Room</h3>
								<div>
									<label className='block text-sm font-medium text-gray-300 mb-2'>Room ID</label>
									<Input
										value={roomId}
										onChange={(e: ChangeEvent<HTMLInputElement>) => setRoomId(e.target.value)}
										placeholder='Enter room ID'
									/>
								</div>
								<Button
									variant={ButtonVariant.PRIMARY}
									size={ComponentSize.LG}
									onClick={handleJoinRoom}
									className='w-full'
									disabled={!roomId.trim() || !isConnected}
								>
									Join Room
								</Button>
								<Button
									variant={ButtonVariant.SECONDARY}
									size={ComponentSize.MD}
									onClick={() => setShowCreateForm(true)}
									className='w-full'
								>
									Create Room Instead
								</Button>
							</div>
						)}

						{error && <div className='bg-red-500/20 border border-red-500 text-red-200 px-4 py-2 rounded'>{error}</div>}

						{!isConnected && (
							<div className='bg-yellow-500/20 border border-yellow-500 text-yellow-200 px-4 py-2 rounded'>
								Connecting to server...
							</div>
						)}
					</CardContent>
				</Card>
			</motion.div>
		</Container>
	);
}
