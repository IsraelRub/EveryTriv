import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MinLength } from 'class-validator';

/**
 * DTO for joining a multiplayer room
 * @class JoinRoomDto
 * @description Data transfer object for joining an existing multiplayer game room
 */
export class JoinRoomDto {
	@ApiProperty({ description: 'Room ID to join', example: '550e8400-e29b-41d4-a716-446655440000' })
	@IsString()
	@IsUUID()
	@MinLength(1)
	roomId!: string;
}
