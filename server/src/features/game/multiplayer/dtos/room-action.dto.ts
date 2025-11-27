import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MinLength } from 'class-validator';

/**
 * DTO for room actions that require only a room identifier
 * @class RoomActionDto
 * @description Used for leave/start operations over HTTP
 */
export class RoomActionDto {
	@ApiProperty({ description: 'Room ID', example: '550e8400-e29b-41d4-a716-446655440000' })
	@IsString()
	@IsUUID()
	@MinLength(1)
	roomId!: string;
}
