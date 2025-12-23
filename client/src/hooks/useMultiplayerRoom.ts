/**
 * Multiplayer Room Hook
 *
 * @module useMultiplayerRoom
 * @description Hook for managing multiplayer room state and operations
 * @used_by client/src/views/multiplayer
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import { RoomStatus } from '@shared/constants';
import type { CreateRoomConfig } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { clientLogger as logger } from '@/services';

import { useMultiplayer } from './useMultiplayer';
import { useUserProfile } from './useUser';

/**
 * Hook for managing multiplayer room
 * @param roomId Room ID (optional)
 * @returns Room state and operations
 */
export const useMultiplayerRoom = (roomId?: string) => {
	const { room, isConnected, createRoom, joinRoom, leaveRoom, startGame, error, roomCode } = useMultiplayer();
	const { data: userProfile } = useUserProfile();
	const [isLoading, setIsLoading] = useState(false);
	const isLoadingRef = useRef(false);

	/**
	 * Create a new room
	 */
	const handleCreateRoom = useCallback(
		async (config: CreateRoomConfig) => {
			setIsLoading(true);
			isLoadingRef.current = true;
			try {
				createRoom(config);
			} catch (err) {
				logger.gameError('Failed to create room', { error: getErrorMessage(err) });
				setIsLoading(false);
				isLoadingRef.current = false;
			}
		},
		[createRoom]
	);

	/**
	 * Join a room
	 */
	const handleJoinRoom = useCallback(
		async (targetRoomId: string) => {
			setIsLoading(true);
			try {
				joinRoom(targetRoomId);
			} catch (err) {
				logger.gameError('Failed to join room', { error: getErrorMessage(err), roomId: targetRoomId });
			} finally {
				setIsLoading(false);
			}
		},
		[joinRoom]
	);

	/**
	 * Leave current room
	 */
	const handleLeaveRoom = useCallback(() => {
		if (room?.roomId) {
			leaveRoom(room.roomId);
		}
	}, [room, leaveRoom]);

	/**
	 * Start the game
	 */
	const handleStartGame = useCallback(() => {
		if (room?.roomId) {
			startGame(room.roomId);
		}
	}, [room, startGame]);

	/**
	 * Check if user is host
	 */
	const isHost = room?.hostId === userProfile?.profile?.id;

	/**
	 * Get current player
	 */
	const currentPlayer = room?.players.find(p => p.userId);

	/**
	 * Check if room is ready to start
	 */
	const isReadyToStart = (room?.players?.length ?? 0) >= 2 && room?.status === RoomStatus.WAITING;

	// Auto-join room if roomId provided
	useEffect(() => {
		if (roomId && isConnected && !room) {
			handleJoinRoom(roomId);
		}
	}, [roomId, isConnected, room, handleJoinRoom]);

	// Stop loading when room is created or error occurs during room creation
	useEffect(() => {
		if (isLoadingRef.current && (room || error)) {
			setIsLoading(false);
			isLoadingRef.current = false;
		}
	}, [room, error]);

	return {
		room,
		isLoading,
		isConnected,
		error,
		isHost,
		currentPlayer,
		isReadyToStart,
		roomCode,
		createRoom: handleCreateRoom,
		joinRoom: handleJoinRoom,
		leaveRoom: handleLeaveRoom,
		startGame: handleStartGame,
	};
};
