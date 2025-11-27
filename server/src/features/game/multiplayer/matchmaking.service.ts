import { Injectable } from '@nestjs/common';

/**
 * Service for matchmaking players
 * @class MatchmakingService
 * @description Handles manual matchmaking (room creation + join code)
 * @note Currently implements manual matchmaking only (simple and fast)
 */
@Injectable()
export class MatchmakingService {
	/**
	 * Generate a short room code for easy sharing
	 * @param roomId Full room ID
	 * @returns Short room code (first 8 characters of UUID)
	 */
	generateRoomCode(roomId: string): string {
		// Use first 8 characters of UUID as room code
		return roomId.substring(0, 8).toUpperCase();
	}
}
