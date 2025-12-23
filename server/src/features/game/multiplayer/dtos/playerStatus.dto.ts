import { ApiProperty } from '@nestjs/swagger';

import { PlayerStatus } from '@shared/constants';
import type { Player } from '@shared/types';

/**
 * DTO for player status
 * @class PlayerStatusDto
 * @description Data transfer object for player status in multiplayer game
 */
export class PlayerStatusDto implements Partial<Player> {
	@ApiProperty({ description: 'User ID' })
	userId!: string;

	@ApiProperty({ description: 'Email' })
	email!: string;

	@ApiProperty({ description: 'Display name', required: false })
	displayName?: string;

	@ApiProperty({ description: 'Current score' })
	score!: number;

	@ApiProperty({
		description: 'Player status',
		enum: PlayerStatus,
	})
	status!: PlayerStatus;

	@ApiProperty({ description: 'Is player the host' })
	isHost!: boolean;

	@ApiProperty({ description: 'Number of answers submitted' })
	answersSubmitted!: number;

	@ApiProperty({ description: 'Number of correct answers' })
	correctAnswers!: number;
}
