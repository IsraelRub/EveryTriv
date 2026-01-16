import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class JoinRoomDto {
	@ApiProperty({
		description: 'Room ID to join (8 alphanumeric characters)',
		example: 'ABC12345',
	})
	@IsString()
	@Length(8, 8)
	@Matches(/^[A-Z0-9]{8}$/, {
		message: 'Room ID must be exactly 8 alphanumeric characters (A-Z, 0-9)',
	})
	roomId!: string;
}
