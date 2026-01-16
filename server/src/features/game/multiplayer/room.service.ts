import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
	ERROR_CODES,
	PlayerStatus,
	QuestionState,
	RoomStatus,
	SERVER_CACHE_KEYS,
	TIME_DURATIONS_SECONDS,
	TIME_PERIODS_MS,
	VALIDATION_COUNT,
	VALIDATION_LENGTH,
} from '@shared/constants';
import type { MultiplayerRoom, Player, RoomConfig } from '@shared/types';
import { getErrorMessage, isMultiplayerRoom } from '@shared/utils';

import { UserEntity } from '@internal/entities';
import { StorageService } from '@internal/modules';
import { serverLogger as logger } from '@internal/services';

@Injectable()
export class RoomService {
	private readonly ROOM_TTL = TIME_DURATIONS_SECONDS.HOUR;
	private readonly IN_MEMORY_CACHE_TTL = TIME_PERIODS_MS.THIRTY_SECONDS;
	private readonly inMemoryRooms = new Map<string, { room: MultiplayerRoom; expiresAt: number }>();
	private readonly ROOM_ID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

	constructor(
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>,
		private readonly storageService: StorageService
	) {}

	private async generateUniqueRoomId(): Promise<string> {
		for (let attempt = 0; attempt < VALIDATION_COUNT.ROOM_GENERATION_ATTEMPTS.MAX; attempt++) {
			const roomId = this.generateRandomRoomId();
			const existingRoom = this.getCachedRoom(roomId);
			if (!existingRoom) {
				// Also check Redis storage
				const result = await this.storageService.get(SERVER_CACHE_KEYS.MULTIPLAYER.ROOM(roomId));
				if (!result.success || !result.data) {
					return roomId;
				}
			}
		}
		// Fallback: add timestamp suffix for guaranteed uniqueness
		return this.generateRandomRoomId();
	}

	private generateRandomRoomId(): string {
		let result = '';
		for (let i = 0; i < VALIDATION_LENGTH.ROOM_CODE.LENGTH; i++) {
			result += this.ROOM_ID_CHARS.charAt(Math.floor(Math.random() * this.ROOM_ID_CHARS.length));
		}
		return result;
	}

	async createRoom(hostId: string, config: RoomConfig): Promise<MultiplayerRoom> {
		try {
			// Validate configuration
			if (config.maxPlayers < VALIDATION_COUNT.PLAYERS.MIN || config.maxPlayers > VALIDATION_COUNT.PLAYERS.MAX) {
				throw new BadRequestException(
					`Max players must be between ${VALIDATION_COUNT.PLAYERS.MIN} and ${VALIDATION_COUNT.PLAYERS.MAX}`
				);
			}

			const { MIN, MAX, UNLIMITED } = VALIDATION_COUNT.QUESTIONS;
			if (
				config.questionsPerRequest !== UNLIMITED &&
				(config.questionsPerRequest < MIN || config.questionsPerRequest > MAX)
			) {
				throw new BadRequestException(
					`Questions per request must be between ${MIN} and ${MAX}, or ${UNLIMITED} for unlimited mode`
				);
			}

			// Get host user
			const host = await this.userRepository.findOne({ where: { id: hostId } });
			if (!host) {
				throw new NotFoundException(ERROR_CODES.HOST_USER_NOT_FOUND);
			}

			// Create unique short room ID
			const roomId = await this.generateUniqueRoomId();

			// Create host player
			const hostPlayer: Player = {
				userId: hostId,
				email: host.email,
				displayName: host.firstName && host.lastName ? `${host.firstName} ${host.lastName}` : host.email,
				score: 0,
				status: PlayerStatus.WAITING,
				joinedAt: new Date(),
				isHost: true,
				answersSubmitted: 0,
				correctAnswers: 0,
			};

			// Create room
			const room: MultiplayerRoom = {
				roomId,
				hostId,
				players: [hostPlayer],
				config,
				status: RoomStatus.WAITING,
				currentQuestionIndex: 0,
				questions: [],
				questionState: QuestionState.IDLE,
				version: 1,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			await this.persistRoomSnapshot(room);

			logger.gameInfo('Multiplayer room created', {
				roomId,
				hostId,
				topic: config.topic,
				difficulty: config.difficulty,
				questionsPerRequest: config.questionsPerRequest,
				maxPlayers: config.maxPlayers,
			});

			return room;
		} catch (error) {
			logger.gameError('Failed to create multiplayer room', {
				errorInfo: { message: getErrorMessage(error) },
				hostId,
				topic: config.topic,
				difficulty: config.difficulty,
				questionsPerRequest: config.questionsPerRequest,
				maxPlayers: config.maxPlayers,
			});
			throw error;
		}
	}

	async getRoom(roomId: string): Promise<MultiplayerRoom | null> {
		try {
			// Normalize room ID to uppercase
			const normalizedId = roomId.toUpperCase();

			// Check in-memory cache first
			const cachedRoom = this.getCachedRoom(normalizedId);
			if (cachedRoom) {
				return cachedRoom;
			}

			// Check Redis storage
			const result = await this.storageService.get(SERVER_CACHE_KEYS.MULTIPLAYER.ROOM(normalizedId));
			if (result.success && result.data && isMultiplayerRoom(result.data)) {
				this.cacheRoom(result.data);
				return result.data;
			}

			return null;
		} catch (error) {
			logger.gameError('Failed to get multiplayer room', {
				errorInfo: { message: getErrorMessage(error) },
				roomId,
			});
			return this.getCachedRoom(roomId.toUpperCase());
		}
	}

	async joinRoom(roomId: string, userId: string): Promise<MultiplayerRoom> {
		try {
			const room = await this.getRoom(roomId);
			if (!room) {
				throw new NotFoundException(ERROR_CODES.ROOM_NOT_FOUND);
			}

			// Check if user is already in room first - before checking room status
			// This allows rejoin even if game has started (PLAYING status)
			// This prevents ROOM_FULL and ROOM_NOT_ACCEPTING_PLAYERS errors when user reconnects
			if (room.players.some(p => p.userId === userId)) {
				return room;
			}

			// Only check room status for new joins
			if (room.status !== RoomStatus.WAITING) {
				throw new BadRequestException(ERROR_CODES.ROOM_NOT_ACCEPTING_PLAYERS);
			}

			if (room.players.length >= room.config.maxPlayers) {
				throw new BadRequestException(ERROR_CODES.ROOM_FULL);
			}

			// Get user
			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new NotFoundException(ERROR_CODES.USER_NOT_FOUND_OR_AUTH_FAILED);
			}

			// Create player
			const player: Player = {
				userId,
				email: user.email,
				displayName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email,
				score: 0,
				status: PlayerStatus.WAITING,
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
				errorInfo: { message: getErrorMessage(error) },
				roomId,
				userId,
			});
			throw error;
		}
	}

	async leaveRoom(roomId: string, userId: string): Promise<MultiplayerRoom | null> {
		try {
			const room = await this.getRoom(roomId);
			if (!room) {
				return null;
			}

			// Remove player
			room.players = room.players.filter(p => p.userId !== userId);

			// If host left and room is not playing, delete room
			if (room.hostId === userId && room.status === RoomStatus.WAITING) {
				await this.deleteRoom(roomId);
				return null;
			}

			// If host left during game, assign new host
			if (room.hostId === userId && room.players.length > 0) {
				const newHost = room.players[0];
				if (newHost != null) {
					room.hostId = newHost.userId;
					newHost.isHost = true;
				}
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
				errorInfo: { message: getErrorMessage(error) },
				roomId,
				userId,
			});
			throw error;
		}
	}

	async updateRoomStatus(roomId: string, status: RoomStatus): Promise<MultiplayerRoom> {
		try {
			this.invalidateRoomCache(roomId);

			const room = await this.getRoom(roomId);
			if (!room) {
				throw new NotFoundException(ERROR_CODES.ROOM_NOT_FOUND);
			}

			room.status = status;
			room.updatedAt = new Date();

			switch (status) {
				case RoomStatus.PLAYING:
					room.startTime = new Date();
					break;
				case RoomStatus.FINISHED:
				case RoomStatus.CANCELLED:
					room.endTime = new Date();
					break;
			}

			await this.persistRoomSnapshot(room);

			return room;
		} catch (error) {
			logger.gameError('Failed to update room status', {
				errorInfo: { message: getErrorMessage(error) },
				roomId,
				status,
			});
			throw error;
		}
	}

	async updateRoom(roomId: string, updates: Partial<MultiplayerRoom>): Promise<MultiplayerRoom> {
		const maxRetries = 3;
		let lastError: Error | null = null;

		for (let attempt = 0; attempt < maxRetries; attempt++) {
			try {
				this.invalidateRoomCache(roomId);

				const room = await this.getRoom(roomId);
				if (!room) {
					throw new NotFoundException(ERROR_CODES.ROOM_NOT_FOUND);
				}

				const expectedVersion = room.version ?? 0;
				const incomingVersion = updates.version;

				if (incomingVersion !== undefined && incomingVersion !== expectedVersion) {
					if (attempt < maxRetries - 1) {
						continue;
					}
					throw new BadRequestException('Room version conflict - room was modified by another operation');
				}

				Object.assign(room, updates);
				if (updates.version === undefined) {
					room.version = (room.version ?? 0) + 1;
				}
				room.updatedAt = new Date();

				await this.persistRoomSnapshot(room);

				return room;
			} catch (error) {
				lastError = error instanceof Error ? error : new Error(String(error));
				if (attempt < maxRetries - 1 && error instanceof BadRequestException) {
					continue;
				}
				logger.gameError('Failed to update room', {
					errorInfo: { message: getErrorMessage(error) },
					roomId,
					attempt: attempt + 1,
				});
				throw error;
			}
		}

		if (lastError) {
			throw lastError;
		}

		throw new NotFoundException(ERROR_CODES.ROOM_NOT_FOUND);
	}

	async deleteRoom(roomId: string): Promise<void> {
		try {
			await this.deleteRoomSnapshot(roomId);
			logger.gameInfo('Multiplayer room deleted', { roomId });
		} catch (error) {
			logger.gameError('Failed to delete multiplayer room', {
				errorInfo: { message: getErrorMessage(error) },
				roomId,
			});
		}
	}

	async findRoomsByUserId(userId: string): Promise<MultiplayerRoom[]> {
		try {
			const keysResult = await this.storageService.getKeys();
			const rooms: MultiplayerRoom[] = [];

			if (keysResult.success && keysResult.data) {
				const roomKeys = keysResult.data.filter(key => key.startsWith('multiplayer:room:'));

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

			for (const cachedRoom of this.inMemoryRooms.values()) {
				const room = cachedRoom.room;
				const alreadyTracked = rooms.some(existing => existing.roomId === room.roomId);
				if (!alreadyTracked && room.players.some(p => p.userId === userId)) {
					rooms.push(room);
				}
			}

			return rooms;
		} catch (error) {
			logger.gameError('Failed to find rooms by user ID', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
			});
			return [];
		}
	}

	private cacheRoom(room: MultiplayerRoom): void {
		this.inMemoryRooms.set(room.roomId, {
			room,
			expiresAt: Date.now() + this.IN_MEMORY_CACHE_TTL,
		});
	}

	private getCachedRoom(roomId: string): MultiplayerRoom | null {
		const cached = this.inMemoryRooms.get(roomId);
		if (!cached) {
			return null;
		}

		if (Date.now() > cached.expiresAt) {
			this.inMemoryRooms.delete(roomId);
			return null;
		}

		return cached.room;
	}

	invalidateRoomCache(roomId: string): void {
		this.inMemoryRooms.delete(roomId);
	}

	private async persistRoomSnapshot(room: MultiplayerRoom): Promise<void> {
		this.cacheRoom(room);
		const maxRetries = 3;
		let lastError: Error | null = null;

		for (let attempt = 0; attempt < maxRetries; attempt++) {
			try {
				const result = await this.storageService.set(
					SERVER_CACHE_KEYS.MULTIPLAYER.ROOM(room.roomId),
					room,
					this.ROOM_TTL
				);
				if (result.success) {
					return;
				}

				lastError = new Error(result.error ?? ERROR_CODES.REDIS_ERROR);
				if (attempt < maxRetries - 1) {
					const delay = Math.min(100 * Math.pow(2, attempt), 400);
					await new Promise(resolve => setTimeout(resolve, delay));
				}
			} catch (error) {
				lastError = error instanceof Error ? error : new Error(String(error));
				if (attempt < maxRetries - 1) {
					const delay = Math.min(100 * Math.pow(2, attempt), 400);
					await new Promise(resolve => setTimeout(resolve, delay));
				}
			}
		}

		logger.gameError('Failed to persist multiplayer room snapshot after retries', {
			roomId: room.roomId,
			errorInfo: { message: getErrorMessage(lastError) },
		});
		throw lastError ?? new Error(ERROR_CODES.REDIS_ERROR);
	}

	private async deleteRoomSnapshot(roomId: string): Promise<void> {
		this.inMemoryRooms.delete(roomId);
		const result = await this.storageService.delete(SERVER_CACHE_KEYS.MULTIPLAYER.ROOM(roomId));
		if (!result.success) {
			logger.gameError('Failed to delete multiplayer room snapshot', {
				roomId,
			});
		}
	}

	async restoreRoom(room: MultiplayerRoom): Promise<void> {
		try {
			await this.persistRoomSnapshot(room);
		} catch (error) {
			logger.gameError('Failed to restore multiplayer room snapshot', {
				errorInfo: { message: getErrorMessage(error) },
				roomId: room.roomId,
			});
		}
	}
}
