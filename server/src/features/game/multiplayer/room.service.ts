import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

import { SERVER_GAME_CONSTANTS } from '@shared/constants';
import { serverLogger as logger } from '@shared/services';
import type { MultiplayerRoom, Player, RoomConfig, RoomStatus } from '@shared/types';
import { getErrorMessage, isMultiplayerRoom } from '@shared/utils';

import { UserEntity } from '@internal/entities';
import { ServerStorageService } from '@internal/modules';

/**
 * Service for managing multiplayer rooms
 * @class RoomService
 * @description Handles room creation, joining, leaving, and state management
 */
@Injectable()
export class RoomService {
	private readonly ROOM_TTL = 3600; // 1 hour
	private readonly ROOM_PREFIX = 'multiplayer:room:';
	private readonly inMemoryRooms = new Map<string, MultiplayerRoom>();

	constructor(
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>,
		private readonly storageService: ServerStorageService
	) {}

	/**
	 * Create a new multiplayer room
	 * @param hostId User ID of the room host
	 * @param config Room configuration
	 * @returns Created room
	 */
	async createRoom(hostId: string, config: RoomConfig): Promise<MultiplayerRoom> {
		try {
			// Validate configuration
			if (config.maxPlayers < 2 || config.maxPlayers > 4) {
				throw new BadRequestException('Max players must be between 2 and 4');
			}

			if (
				config.requestedQuestions < 1 ||
				config.requestedQuestions > SERVER_GAME_CONSTANTS.MAX_QUESTIONS_PER_REQUEST
			) {
				throw new BadRequestException(
					`Requested questions must be between 1 and ${SERVER_GAME_CONSTANTS.MAX_QUESTIONS_PER_REQUEST}`
				);
			}

			// Get host user
			const host = await this.userRepository.findOne({ where: { id: hostId } });
			if (!host) {
				throw new NotFoundException('Host user not found');
			}

			// Create room ID
			const roomId = uuidv4();

			// Create host player
			const hostPlayer: Player = {
				userId: hostId,
				email: host.email,
				displayName: host.firstName && host.lastName ? `${host.firstName} ${host.lastName}` : host.email,
				score: 0,
				status: 'waiting',
				joinedAt: new Date(),
				isHost: true,
				answersSubmitted: 0,
				correctAnswers: 0,
			};

			// Create room
			const room: MultiplayerRoom = {
				id: roomId,
				roomId,
				hostId,
				players: [hostPlayer],
				config: {
					...config,
					timePerQuestion: 30, // Fixed 30 seconds for simultaneous games
				},
				status: 'waiting',
				currentQuestionIndex: 0,
				questions: [],
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			await this.persistRoomSnapshot(room);

			logger.gameInfo('Multiplayer room created', {
				roomId,
				hostId,
				topic: config.topic,
				difficulty: config.difficulty,
				requestedQuestions: config.requestedQuestions,
				maxPlayers: config.maxPlayers,
			});

			return room;
		} catch (error) {
			logger.gameError('Failed to create multiplayer room', {
				error: getErrorMessage(error),
				hostId,
				topic: config.topic,
				difficulty: config.difficulty,
				requestedQuestions: config.requestedQuestions,
				maxPlayers: config.maxPlayers,
			});
			throw error;
		}
	}

	/**
	 * Get room by ID
	 * @param roomId Room ID
	 * @returns Room or null if not found
	 */
	async getRoom(roomId: string): Promise<MultiplayerRoom | null> {
		try {
			const result = await this.storageService.get(this.getRoomKey(roomId));
			if (result.success && result.data && isMultiplayerRoom(result.data)) {
				this.cacheRoom(result.data);
				return result.data;
			}
			return this.getCachedRoom(roomId);
		} catch (error) {
			logger.gameError('Failed to get multiplayer room', {
				error: getErrorMessage(error),
				roomId,
			});
			return this.getCachedRoom(roomId);
		}
	}

	/**
	 * Join a room
	 * @param roomId Room ID
	 * @param userId User ID joining the room
	 * @returns Updated room
	 */
	async joinRoom(roomId: string, userId: string): Promise<MultiplayerRoom> {
		try {
			const room = await this.getRoom(roomId);
			if (!room) {
				throw new NotFoundException('Room not found');
			}

			if (room.status !== 'waiting') {
				throw new BadRequestException('Room is not accepting new players');
			}

			if (room.players.length >= room.config.maxPlayers) {
				throw new BadRequestException('Room is full');
			}

			// Check if user is already in room
			if (room.players.some(p => p.userId === userId)) {
				return room;
			}

			// Get user
			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new NotFoundException('User not found');
			}

			// Create player
			const player: Player = {
				userId,
				email: user.email,
				displayName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email,
				score: 0,
				status: 'waiting',
				joinedAt: new Date(),
				isHost: false,
				answersSubmitted: 0,
				correctAnswers: 0,
			};

			// Add player to room
			room.players.push(player);
			room.updatedAt = new Date();

			await this.persistRoomSnapshot(room);

			logger.gameInfo('Player joined multiplayer room', {
				roomId,
				userId,
				playerCount: room.players.length,
			});

			return room;
		} catch (error) {
			logger.gameError('Failed to join multiplayer room', {
				error: getErrorMessage(error),
				roomId,
				userId,
			});
			throw error;
		}
	}

	/**
	 * Leave a room
	 * @param roomId Room ID
	 * @param userId User ID leaving the room
	 * @returns Updated room or null if room is empty
	 */
	async leaveRoom(roomId: string, userId: string): Promise<MultiplayerRoom | null> {
		try {
			const room = await this.getRoom(roomId);
			if (!room) {
				return null;
			}

			// Remove player
			room.players = room.players.filter(p => p.userId !== userId);

			// If host left and room is not playing, delete room
			if (room.hostId === userId && room.status === 'waiting') {
				await this.deleteRoom(roomId);
				return null;
			}

			// If host left during game, assign new host
			if (room.hostId === userId && room.players.length > 0) {
				room.hostId = room.players[0].userId;
				room.players[0].isHost = true;
			}

			// If room is empty, delete it
			if (room.players.length === 0) {
				await this.deleteRoom(roomId);
				return null;
			}

			room.updatedAt = new Date();

			await this.persistRoomSnapshot(room);

			logger.gameInfo('Player left multiplayer room', {
				roomId,
				userId,
				playerCount: room.players.length,
			});

			return room;
		} catch (error) {
			logger.gameError('Failed to leave multiplayer room', {
				error: getErrorMessage(error),
				roomId,
				userId,
			});
			throw error;
		}
	}

	/**
	 * Update room status
	 * @param roomId Room ID
	 * @param status New status
	 * @returns Updated room
	 */
	async updateRoomStatus(roomId: string, status: RoomStatus): Promise<MultiplayerRoom> {
		try {
			const room = await this.getRoom(roomId);
			if (!room) {
				throw new NotFoundException('Room not found');
			}

			room.status = status;
			room.updatedAt = new Date();

			if (status === 'playing') {
				room.startTime = new Date();
			} else if (status === 'finished' || status === 'cancelled') {
				room.endTime = new Date();
			}

			await this.persistRoomSnapshot(room);

			return room;
		} catch (error) {
			logger.gameError('Failed to update room status', {
				error: getErrorMessage(error),
				roomId,
				status,
			});
			throw error;
		}
	}

	/**
	 * Update room
	 * @param roomId Room ID
	 * @param updates Partial room updates
	 * @returns Updated room
	 */
	async updateRoom(roomId: string, updates: Partial<MultiplayerRoom>): Promise<MultiplayerRoom> {
		try {
			const room = await this.getRoom(roomId);
			if (!room) {
				throw new NotFoundException('Room not found');
			}

			Object.assign(room, updates);
			room.updatedAt = new Date();

			await this.persistRoomSnapshot(room);

			return room;
		} catch (error) {
			logger.gameError('Failed to update room', {
				error: getErrorMessage(error),
				roomId,
			});
			throw error;
		}
	}

	/**
	 * Delete a room
	 * @param roomId Room ID
	 */
	async deleteRoom(roomId: string): Promise<void> {
		try {
			await this.deleteRoomSnapshot(roomId);
			logger.gameInfo('Multiplayer room deleted', { roomId });
		} catch (error) {
			logger.gameError('Failed to delete multiplayer room', {
				error: getErrorMessage(error),
				roomId,
			});
		}
	}

	/**
	 * Find all rooms that a user is in
	 * @param userId User ID
	 * @returns Array of rooms the user is in
	 */
	async findRoomsByUserId(userId: string): Promise<MultiplayerRoom[]> {
		try {
			const keysResult = await this.storageService.getKeys();
			const rooms: MultiplayerRoom[] = [];

			if (keysResult.success && keysResult.data) {
				const roomKeys = keysResult.data.filter(key => key.startsWith(this.ROOM_PREFIX));

				for (const key of roomKeys) {
					const result = await this.storageService.get(key);
					if (result.success && result.data && isMultiplayerRoom(result.data)) {
						const room = result.data;
						this.cacheRoom(room);
						if (room.players.some(p => p.userId === userId)) {
							rooms.push(room);
						}
					}
				}
			}

			for (const room of this.inMemoryRooms.values()) {
				const alreadyTracked = rooms.some(existing => existing.roomId === room.roomId);
				if (!alreadyTracked && room.players.some(p => p.userId === userId)) {
					rooms.push(room);
				}
			}

			return rooms;
		} catch (error) {
			logger.gameError('Failed to find rooms by user ID', {
				error: getErrorMessage(error),
				userId,
			});
			return [];
		}
	}

	private cacheRoom(room: MultiplayerRoom): void {
		this.inMemoryRooms.set(room.roomId, room);
	}

	private getCachedRoom(roomId: string): MultiplayerRoom | null {
		return this.inMemoryRooms.get(roomId) ?? null;
	}

	private async persistRoomSnapshot(room: MultiplayerRoom): Promise<void> {
		this.cacheRoom(room);
		const result = await this.storageService.set(this.getRoomKey(room.roomId), room, this.ROOM_TTL);
		if (!result.success) {
			logger.gameError('Failed to persist multiplayer room snapshot', {
				roomId: room.roomId,
			});
		}
	}

	private async deleteRoomSnapshot(roomId: string): Promise<void> {
		this.inMemoryRooms.delete(roomId);
		const result = await this.storageService.delete(this.getRoomKey(roomId));
		if (!result.success) {
			logger.gameError('Failed to delete multiplayer room snapshot', {
				roomId,
			});
		}
	}

	/**
	 * Get room key for Redis
	 * @param roomId Room ID
	 * @returns Redis key
	 */
	private getRoomKey(roomId: string): string {
		return `${this.ROOM_PREFIX}${roomId}`;
	}

	/**
	 * Restore room snapshot in storage (used for HTTP proxy retries)
	 * @param room Room data to persist
	 */
	async restoreRoom(room: MultiplayerRoom): Promise<void> {
		try {
			await this.persistRoomSnapshot(room);
		} catch (error) {
			logger.gameError('Failed to restore multiplayer room snapshot', {
				error: getErrorMessage(error),
				roomId: room.roomId,
			});
		}
	}
}
