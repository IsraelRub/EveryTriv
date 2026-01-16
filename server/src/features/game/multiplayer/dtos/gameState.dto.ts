import { ApiProperty } from '@nestjs/swagger';

import type { CountRecord, GameState, MultiplayerRoom, Player } from '@shared/types';

export class GameStateDto implements GameState {
	@ApiProperty({ description: 'Room ID' })
	roomId!: string;

	@ApiProperty({ description: 'Current question', nullable: true })
	currentQuestion!: GameState['currentQuestion'];

	@ApiProperty({ description: 'Current question index' })
	currentQuestionIndex!: number;

	@ApiProperty({ description: 'Total number of questions' })
	gameQuestionCount!: number;

	@ApiProperty({ description: 'Time remaining in seconds' })
	timeRemaining!: number;

	@ApiProperty({ description: 'Players answers mapping' })
	playersAnswers!: CountRecord;

	@ApiProperty({ description: 'Players scores mapping' })
	playersScores!: CountRecord;

	@ApiProperty({ description: 'Current leaderboard' })
	leaderboard!: Player[];

	@ApiProperty({ description: 'Game start time', nullable: true })
	startedAt?: Date;
}

export class RoomStateDto implements Partial<MultiplayerRoom> {
	@ApiProperty({ description: 'Room ID' })
	roomId!: string;

	@ApiProperty({ description: 'Host user ID' })
	hostId!: string;

	@ApiProperty({ description: 'List of players in room' })
	players!: Player[];

	@ApiProperty({ description: 'Room status' })
	status!: MultiplayerRoom['status'];

	@ApiProperty({ description: 'Current question index' })
	currentQuestionIndex!: number;

	@ApiProperty({ description: 'Room configuration' })
	config!: MultiplayerRoom['config'];
}
