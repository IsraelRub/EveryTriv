import { ApiProperty } from '@nestjs/swagger';

import { PlayerStatus } from '@shared/constants';
import type { Player } from '@shared/types';

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
