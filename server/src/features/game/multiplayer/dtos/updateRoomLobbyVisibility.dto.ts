import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString, Length, Matches } from 'class-validator';

export class UpdateRoomLobbyVisibilityDto {
	@ApiProperty({
		description: 'Room ID (8 alphanumeric characters)',
		example: 'ABC12345',
	})
	@IsString()
	@Length(8, 8)
	@Matches(/^[A-Z0-9]{8}$/, {
		message: 'Room ID must be exactly 8 alphanumeric characters (A-Z, 0-9)',
	})
	roomId!: string;

	@ApiProperty({ description: 'Whether the waiting room appears on the public home lobby list' })
	@IsBoolean()
	isPublicLobby!: boolean;
}
